import type {
   APIUser,
   GatewayPayload,
   GatewayStatus,
   GatewayUpdatePresenceData,
   GatewayUpdateVoiceState,
   GatewayVoiceState,
   GatewayVoiceStateFlags,
   Snowflake,
} from "@huginn/shared";

import { error, GatewayCode, type GatewayWebsocketEvents, type GatewayHello, GatewayOperations, type GatewayReadyData, log } from "@huginn/shared";

import type { GatewayOptions } from "./types";

import { type HuginnClient } from ".";
import { defaultClientOptions } from "./utils";
import { SharedWebsocket } from "./websocket";

export type AuthenticationStatus = "success" | "authentication_failed" | "network_error";
type AuthenticationResult = {
   authenticated: boolean;
   status: AuthenticationStatus;
   retryable: boolean;
};

type Events = {
   reconnected: undefined;
   message: GatewayPayload;
   send: GatewayPayload;
   connected: undefined;
   disconnected: number;
   status_changed: GatewayStatus;
} & GatewayWebsocketEvents;

export class Gateway extends SharedWebsocket<Events> {
   public readonly options: GatewayOptions;
   private readonly client: HuginnClient;

   public socket?: WebSocket;
   public sessionId?: Snowflake;
   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private reconnectTimeout?: ReturnType<typeof setTimeout>;
   private sequence?: number;
   private intentionalClose = false;

   private _status: GatewayStatus = "idle";
   private _user?: APIUser;

   public constructor(client: HuginnClient, options?: Partial<GatewayOptions>) {
      super();
      this.options = { ...defaultClientOptions.gateway, ...options };
      this.client = client;
   }

   private setStatus(newStatus: GatewayStatus) {
      if (this._status !== newStatus) {
         this._status = newStatus;
         this.emit("status_changed", newStatus);
      }
   }

   public get status(): GatewayStatus {
      return this._status;
   }

   public get user(): APIUser | undefined {
      return this._user;
   }

   private setUser(user: APIUser | undefined): void {
      this._user = user;
   }

   public get isConnected(): boolean {
      return this._status === "helloed" || this._status === "authenticated";
   }

   public get isAuthenticated(): boolean {
      return this._status === "authenticated";
   }

   public get canResume(): boolean {
      return !!this.sessionId && this.sequence !== undefined && this._status !== "authenticated" && !!this._user;
   }

   // ============================================================
   // Public API - Connection Management
   // ============================================================

   public connect(): void {
      log("api:gateway", "default", "connect");

      if (this.status !== "idle" && this.status !== "disconnected") {
         throw new Error("Gateway socket is already connected or is connecting");
      }

      this.intentionalClose = false;
      this.setStatus("connecting");
      this.socket = this.options.createSocket(this.options.url);

      this.socket.onopen = () => this.onOpen();
      this.socket.onclose = (e) => this.onClose(e);
      this.socket.onmessage = (e) => this.onMessage(e);
      this.socket.onerror = (e) => {
         error("api:gateway", "gateway websocket encountered an error");
      };
   }

   /**
    * Intentionally closes the connection and prevents automatic reconnection. This should be used when the user explicitly wants to disconnect, such as logging out or switching accounts.
    */
   public close(): void {
      log("api:gateway", "default", "intentional close");

      this.intentionalClose = true;
      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
   }

   public async authenticate(): Promise<AuthenticationResult> {
      log("api:gateway", "default", "authenticate");

      if (this.isAuthenticated) {
         return { authenticated: true, retryable: true, status: "success" };
      }

      if (!this.isConnected) {
         const result = await this.ensureConnected();
         if (!result) {
            return { authenticated: false, retryable: true, status: "network_error" };
         }
      }

      if (this.canResume) {
         this.sendResume();
      } else {
         this.sendIdentify();
      }

      return this.waitForAuthentication();
   }

   // ============================================================
   // Private - Connection Lifecycle
   // ============================================================

   private onOpen() {
      log("api:gateway", "default", "connected");

      this.setStatus("connected");
      this.emit("connected", undefined);
   }

   private onClose(e: CloseEvent) {
      log("api:gateway", "default", "closed", "c:", e.code, "r:", e.reason);

      this.cleanup();
      this.setStatus("disconnected");
      this.emit("disconnected", e.code);

      // Completely reset if it was intentionally closed or session was invalid
      if (this.shouldReset(e.code)) {
         this.reset();
      }

      // Don't reconnect if it was intentionally closed
      if (!this.intentionalClose && e.code !== GatewayCode.SWITCHING_CONNECTION) {
         this.scheduleReconnect();
      }
   }

   // ============================================================
   // Private - Message Processing
   // ============================================================

   private async onMessage(e: MessageEvent) {
      const data: GatewayPayload = JSON.parse(e.data);

      if (data.op === GatewayOperations.DISPATCH) {
         log("api:gateway", "recv", "op:", data.op, "t:", data.t);
         log("api:gateway", "recv-detail", "op:", data.op, "t:", data.t, "d:", data.d);
      } else {
         log("api:gateway", "recv", "op:", data.op);
         if ("d" in data) {
            log("api:gateway", "recv-detail", "op:", data.op, "d:", data.d);
         }
      }

      switch (data.op) {
         case GatewayOperations.HELLO: {
            await this.handleHello(data);
            break;
         }
         case GatewayOperations.DISPATCH: {
            this.sequence = data.s;

            switch (data.t) {
               case "ready":
                  this.handleReady(data.d);
                  break;
               case "resumed":
                  this.handleResumed();
                  break;
            }

            this.emit(data.t, data.d);
         }
      }

      this.emit("message", data);
   }

   private async handleHello(data: GatewayHello) {
      this.setStatus("helloed");

      this.startHeartbeat(data.d.heartbeatInterval);

      if (!this.sessionId) {
         this.sessionId = data.d.sessionId;
      }

      this.emit("hello", data.d);
   }

   private handleResumed() {
      this.setStatus("authenticated");
   }

   private handleReady(data: GatewayReadyData) {
      this.setStatus("authenticated");
      this.setUser(data.user);
   }

   // ============================================================
   // Public API - Voice State Management
   // ============================================================

   public async getVoiceToken(guildId: Snowflake | null, channelId: Snowflake, voiceState?: GatewayVoiceStateFlags): Promise<string | undefined> {
      this.sendVoiceStateUpdate({
         guildId,
         channelId,
         isAudioDeafened: false,
         isAudioMuted: false,
         isCameraOn: false,
         isAudioStreaming: false,
         isScreenSharing: false,
         ...voiceState,
      });

      const [tokenResult, _voiceStateResult] = await Promise.allSettled([this.waitForVoiceServerUpdate(), this.waitForVoiceStateUpdate(channelId)]);

      return tokenResult.status === "fulfilled" ? tokenResult.value : undefined;
   }

   public async sendDefaultVoiceState(): Promise<void> {
      log("api:gateway", "default", "send default voice state");

      this.sendVoiceStateUpdate({
         channelId: null,
         guildId: null,
         isAudioDeafened: false,
         isAudioMuted: false,
         isAudioStreaming: false,
         isScreenSharing: false,
         isCameraOn: false,
      });

      this.waitForVoiceStateUpdate(null);
   }

   public async updateVoiceState(options: GatewayVoiceStateFlags, channelId: Snowflake, guildId: Snowflake | null): Promise<GatewayVoiceState> {
      log("api:gateway", "default", "update voice state", "opts:", JSON.stringify(options));

      this.sendVoiceStateUpdate({ channelId, guildId, ...options });
      return this.waitForVoiceStateUpdate(channelId);
   }

   // ============================================================
   // Public API - Presence Management
   // ============================================================

   public updatePresence(options: GatewayUpdatePresenceData): void {
      log("api:gateway", "default", "update presence", "sts:", options.status);

      if (this.status !== "authenticated") {
         return;
      }

      const updatePresenceData: GatewayPayload = {
         op: GatewayOperations.PRESENCE_UPDATE,
         d: { status: options.status, activities: options.activities },
      };

      this.send(updatePresenceData);
   }

   // ============================================================
   // Private - Authentication
   // ============================================================

   private async ensureConnected(): Promise<boolean> {
      if (this.status === "idle") {
         this.connect();
      }

      if (this.status === "connecting" || this.status === "connected") {
         const result = await this.waitForEvents(["hello", "disconnected"], true);

         if (result.event === "disconnected") {
            return false;
         }
      }

      return true;
   }

   private async waitForAuthentication(): Promise<AuthenticationResult> {
      const result = await this.waitForEvents(["ready", "resumed", "disconnected"], true);

      switch (result.event) {
         case "ready":
         case "resumed":
            return { authenticated: true, retryable: true, status: "success" };
         case "disconnected":
            return {
               authenticated: false,
               retryable: result.data !== GatewayCode.AUTHENTICATION_FAILED,
               status: result.data !== GatewayCode.AUTHENTICATION_FAILED ? "network_error" : "authentication_failed",
            };
         default:
            return { authenticated: false, retryable: false, status: "authentication_failed" };
      }
   }

   private sendResume(): void {
      const token = this.client.tokenHandler.token;
      if (!token || !this.sessionId || this.sequence === undefined) {
         throw new Error("Cannot resume: missing token, session or sequence");
      }

      this.send({
         op: GatewayOperations.RESUME,
         d: { token, sessionId: this.sessionId, seq: this.sequence },
      });
   }

   private sendIdentify() {
      const token = this.client.tokenHandler.token;
      if (!token) throw new Error("Cannot identify: no token");

      this.send({
         op: GatewayOperations.IDENTIFY,
         d: {
            token,
            intents: this.options.intents,
            properties: { os: "windows", browser: "idk", device: "idk" },
         },
      });
   }

   // ============================================================
   // Private - Voice State Helpers
   // ============================================================

   private sendVoiceStateUpdate(state: GatewayUpdateVoiceState["d"]): void {
      this.send({
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: state,
      });
   }

   private waitForVoiceServerUpdate(): Promise<string> {
      return new Promise((resolve) => {
         const unlisten = this.listen("voice_server_update", (data) => {
            unlisten();
            resolve(data.token);
         });
      });
   }

   private waitForVoiceStateUpdate(targetChannelId: Snowflake | null): Promise<GatewayVoiceState> {
      return new Promise((resolve) => {
         const unlisten = this.listen("voice_state_update", (data) => {
            if (data.userId === this.user?.id && data.channelId === targetChannelId) {
               unlisten();
               resolve(data);
            }
         });
      });
   }

   // ============================================================
   // Private - Heartbeat
   // ============================================================

   private startHeartbeat(interval: number) {
      log("api:gateway", "heartbeat", "start");

      this.stopHeartbeat();

      this.heartbeatInterval = setInterval(() => {
         log("api:gateway", "heartbeat", "sent", "s:", this.sequence);
         this.send({ op: GatewayOperations.HEARTBEAT, d: this.sequence });
      }, interval);
   }

   private stopHeartbeat() {
      if (this.heartbeatInterval) {
         log("api:gateway", "heartbeat", "stop");
         clearInterval(this.heartbeatInterval);
         this.heartbeatInterval = undefined;
      }
   }

   // ============================================================
   // Private - Reconnection
   // ============================================================

   private scheduleReconnect(): void {
      this.clearReconnectTimeout();

      log("api:gateway", "default", "schedule reconnect");

      this.reconnectTimeout = setTimeout(() => {
         this.attemptReconnect();
      }, 2000);
   }

   private async attemptReconnect() {
      log("api:gateway", "default", "attempt reconnect");

      this.connect();

      // If we had a user, re-authenticate
      if (this.user) {
         try {
            await this.authenticate();
            this.emit("reconnected", undefined);
         } catch (e) {
            error("api:gateway", "reconnect failed", e);
         }
      }
   }

   private clearReconnectTimeout(): void {
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
   }

   // ============================================================
   // Private - Cleanup
   // ============================================================

   /**
    * This is called when socket is closed to cleanup heartbeat and socket instance.
    */
   private cleanup() {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
         this.socket.close();
      }

      this.socket = undefined;
      this.stopHeartbeat();
   }

   /**
    * This is called when we determine that the session is invalid and we need to reset everything, including sequence and session ID.
    */
   public reset(): void {
      log("api:gateway", "default", "reset session");
      this.sequence = undefined;
      this.sessionId = undefined;
   }

   private shouldReset(closeCode: number): boolean {
      return (
         this.intentionalClose ||
         closeCode === GatewayCode.INVALID_SESSION ||
         closeCode === GatewayCode.AUTHENTICATION_FAILED ||
         closeCode === GatewayCode.SWITCHING_CONNECTION
      );
   }

   // ============================================================
   // Private - Utilities
   // ============================================================

   private send(data: GatewayPayload): void {
      this.socket?.send(JSON.stringify(data));
      this.emit("send", data as GatewayPayload);

      log("api:gateway", "send", "op:", data.op, "t:", "t" in data ? data.t : "_");
      log("api:gateway", "send-detail", "op:", data.op, "t:", "t" in data ? data.t : "_", "d:", "d" in data ? data.d : "_");
   }
}
