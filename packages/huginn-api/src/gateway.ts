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

import {
   GatewayCode,
   type GatewayWebsocketEvents,
   type GatewayHello,
   GatewayOperations,
   type GatewayReadyData,
   analytics,
   recordSpanError,
   SpanStatusCode,
} from "@huginn/shared";

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
      analytics.startActiveSpan("apiGateway.setStatus", (span) => {
         span.setAttributes({ ...this.getDefaultAttributes(), "gateway.new_status": newStatus, "gateway.old_status": this._status });
         if (this._status !== newStatus) {
            this._status = newStatus;
            this.emit("status_changed", newStatus);
         }

         span.end();
      });
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
      analytics.startActiveSpan("apiGateway.connect", (span) => {
         span.setAttributes(this.getDefaultAttributes());
         try {
            if (this.status !== "idle" && this.status !== "disconnected") {
               throw new Error("Gateway socket is already connected or is connecting");
            }

            this.intentionalClose = false;
            this.setStatus("connecting");
            this.socket = this.options.createSocket(this.options.url);

            this.socket.onopen = () => this.onOpen();
            this.socket.onclose = (e) => this.onClose(e);
            this.socket.onmessage = (e) => this.onMessage(e);
            this.socket.onerror = () => this.onError();
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   /**
    * Intentionally closes the connection and prevents automatic reconnection. This should be used when the user explicitly wants to disconnect, such as logging out or switching accounts.
    */
   public close(): void {
      analytics.startActiveSpan("apiGateway.close", (span) => {
         span.setAttributes(this.getDefaultAttributes());

         this.intentionalClose = true;
         this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
         span.end();
      });
   }

   public async authenticate(): Promise<AuthenticationResult> {
      return await analytics.startActiveSpan("apiGateway.authenticate", async (span): Promise<AuthenticationResult> => {
         span.setAttributes(this.getDefaultAttributes());
         try {
            if (this.isAuthenticated) {
               return { authenticated: true, retryable: true, status: "success" };
            }

            if (!this.isConnected) {
               const result = await this.ensureConnected();
               if (!result) {
                  span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to connect to gateway" });
                  return { authenticated: false, retryable: true, status: "network_error" };
               }
            }

            span.setAttribute("gateway.can_resume", this.canResume);
            if (this.canResume) {
               this.sendResume();
            } else {
               this.sendIdentify();
            }

            return await this.waitForAuthentication();
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   // ============================================================
   // Private - Connection Lifecycle
   // ============================================================

   private onOpen() {
      analytics.startActiveSpan("apiGateway.onOpen", (span) => {
         span.setAttributes(this.getDefaultAttributes());

         this.setStatus("connected");
         this.emit("connected", undefined);
         span.end();
      });
   }

   private onClose(e: CloseEvent) {
      analytics.startActiveSpan("apiGateway.onClose", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "event.close.code": e.code,
            "event.close.reason": e.reason,
         });
         try {
            this.cleanup();
            this.setStatus("disconnected");
            this.emit("disconnected", e.code);

            span.setAttribute("gateway.intentional_close", this.intentionalClose);
            span.setAttribute("gateway.can_resume", this.canResume);

            const shouldReset = this.shouldReset(e.code);
            span.setAttribute("gateway.should_reset", shouldReset);
            // Completely reset if it was intentionally closed or session was invalid
            if (shouldReset) {
               this.reset();
            }

            // Don't reconnect if it was intentionally closed
            if (!this.intentionalClose) {
               analytics.withRootContext(() => {
                  this.scheduleReconnect();
               });
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   private onError() {
      analytics.startActiveSpan("apiGateway.onError", (span) => {
         span.setAttributes(this.getDefaultAttributes());
         span.setStatus({ code: SpanStatusCode.ERROR });
         span.end();
      });
   }
   // ============================================================
   // Private - Message Processing
   // ============================================================

   private async onMessage(e: MessageEvent) {
      const data: GatewayPayload = JSON.parse(e.data);

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
      return await analytics.startActiveSpan("apiGateway.getVoiceToken", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.guild_id": guildId ?? "null",
            "params.channel_id": channelId,
            "params.is_camera_on": !!voiceState?.isCameraOn,
            "params.is_deafened": !!voiceState?.isAudioDeafened,
            "params.is_muted": !!voiceState?.isAudioMuted,
            "params.is_streaming": !!voiceState?.isAudioStreaming,
            "params.is_screen_sharing": !!voiceState?.isScreenSharing,
         });

         try {
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

            const [tokenResult, _voiceStateResult] = await Promise.allSettled([
               this.waitForVoiceServerUpdate(),
               this.waitForVoiceStateUpdate(channelId),
            ]);

            span.setAttribute("token.result", tokenResult.status);

            return tokenResult.status === "fulfilled" ? tokenResult.value : undefined;
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   public async sendDefaultVoiceState(): Promise<void> {
      return await analytics.startActiveSpan("apiGateway.sendDefaultVoiceState", async (span) => {
         span.setAttributes(this.getDefaultAttributes());
         try {
            this.sendVoiceStateUpdate({
               channelId: null,
               guildId: null,
               isAudioDeafened: false,
               isAudioMuted: false,
               isAudioStreaming: false,
               isScreenSharing: false,
               isCameraOn: false,
            });

            await this.waitForVoiceStateUpdate(null);
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   public async updateVoiceState(options: GatewayVoiceStateFlags, channelId: Snowflake, guildId: Snowflake | null): Promise<GatewayVoiceState> {
      return await analytics.startActiveSpan("apiGateway.updateVoiceState", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.channel_id": channelId,
            "params.guild_id": guildId ?? "null",
            "params.is_camera_on": !!options.isCameraOn,
            "params.is_deafened": !!options.isAudioDeafened,
            "params.is_muted": !!options.isAudioMuted,
            "params.is_streaming": !!options.isAudioStreaming,
            "params.is_screen_sharing": !!options.isScreenSharing,
         });

         try {
            this.sendVoiceStateUpdate({ channelId, guildId, ...options });
            return await this.waitForVoiceStateUpdate(channelId);
         } finally {
            span.end();
         }
      });
   }

   // ============================================================
   // Public API - Presence Management
   // ============================================================

   public updatePresence(options: GatewayUpdatePresenceData): void {
      return analytics.startActiveSpan("apiGateway.updatePresence", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.status": options.status,
            "params.activities_count": options.activities.length,
         });

         try {
            if (this.status !== "authenticated") return;

            const updatePresenceData: GatewayPayload = {
               op: GatewayOperations.PRESENCE_UPDATE,
               d: { status: options.status, activities: options.activities },
            };

            this.send(updatePresenceData);
         } finally {
            span.end();
         }
      });
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
      return await analytics.startActiveSpan("apiGateway.waitForAuthentication", async (span): Promise<AuthenticationResult> => {
         span.setAttributes(this.getDefaultAttributes());

         try {
            const result = await this.waitForEvents(["ready", "resumed", "disconnected"], true);

            span.setAttribute("auth.event", result.event);
            switch (result.event) {
               case "ready":
               case "resumed":
                  return { authenticated: true, retryable: true, status: "success" };
               case "disconnected":
                  span.setAttribute("auth.data", result.data as GatewayCode);
                  span.setStatus({ code: SpanStatusCode.ERROR, message: "Disconnected while waiting for authentication" });
                  return {
                     authenticated: false,
                     retryable: result.data !== GatewayCode.AUTHENTICATION_FAILED,
                     status: result.data !== GatewayCode.AUTHENTICATION_FAILED ? "network_error" : "authentication_failed",
                  };
               default:
                  return { authenticated: false, retryable: false, status: "authentication_failed" };
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
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
      analytics.startActiveSpan("apiGateway.sendIdentify", (span) => {
         span.setAttributes(this.getDefaultAttributes());
         try {
            const token = this.client.tokenHandler.token;
            span.setAttribute("gateway.has_token", !!token);
            if (!token) throw new Error("Cannot identify: no token");

            this.send({
               op: GatewayOperations.IDENTIFY,
               d: {
                  token,
                  intents: this.options.intents,
                  properties: { os: "windows", browser: "idk", device: "idk" },
               },
            });
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
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
      this.stopHeartbeat();

      this.heartbeatInterval = setInterval(() => {
         this.send({ op: GatewayOperations.HEARTBEAT, d: this.sequence });
      }, interval);
   }

   private stopHeartbeat() {
      if (this.heartbeatInterval) {
         clearInterval(this.heartbeatInterval);
         this.heartbeatInterval = undefined;
      }
   }

   // ============================================================
   // Private - Reconnection
   // ============================================================

   private scheduleReconnect(): void {
      this.clearReconnectTimeout();

      this.reconnectTimeout = setTimeout(() => {
         this.attemptReconnect();
      }, 2000);
   }

   private async attemptReconnect() {
      analytics.startActiveSpan("apiGateway.attemptReconnect", async (span) => {
         span.setAttributes(this.getDefaultAttributes());
         try {
            this.connect();

            span.setAttribute("gateway.had_user", !!this.user);
            // If we had a user, re-authenticate
            if (this.user) {
               await this.authenticate();
               this.emit("reconnected", undefined);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
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
      this.sequence = undefined;
      this.sessionId = undefined;
   }

   private shouldReset(closeCode: number): boolean {
      return (
         this.intentionalClose || closeCode === GatewayCode.INVALID_SESSION || closeCode === GatewayCode.AUTHENTICATION_FAILED
         // closeCode === GatewayCode.SWITCHING_CONNECTION
      );
   }

   // ============================================================
   // Private - Utilities
   // ============================================================

   private send(data: GatewayPayload): void {
      this.socket?.send(JSON.stringify(data));
      this.emit("send", data as GatewayPayload);
   }

   private getDefaultAttributes(): Record<string, any> {
      return {
         "gateway.url": this.options.url,
         "gateway.intents": this.options.intents,
         "gateway.status": this.status,
         "gateway.session_id": this.sessionId ?? "null",
         "gateway.user.id": this.user?.id ?? "null",
         "gateway.is_authenticated": this.isAuthenticated,
         "gateway.is_connected": this.isConnected,
      };
   }
}
