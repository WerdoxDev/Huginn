import type { GatewayPayload, GatewayStatus, GatewayUpdateVoiceState, GatewayVoiceState, GatewayVoiceStateFlags, Snowflake } from "@huginn/shared";
import {
   error,
   GatewayCode,
   type GatewayEvents,
   type GatewayHeartbeat,
   type GatewayHello,
   type GatewayIdentify,
   GatewayOperations,
   type GatewayReadyData,
   type GatewayResume,
   log,
   omit,
} from "@huginn/shared";
import type { HuginnClient } from ".";
import type { GatewayOptions } from "./types";
import { defaultClientOptions } from "./utils";
import { SharedWebsocket } from "./websocket";

export class Gateway extends SharedWebsocket<GatewayEvents> {
   public readonly options: GatewayOptions;
   private readonly client: HuginnClient;

   public socket?: WebSocket;
   public sessionId?: Snowflake;

   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private sequence?: number;

   private _status: GatewayStatus = "none";
   private set status(newStatus: GatewayStatus) {
      this._status = newStatus;
      this.emit("status_changed", newStatus);
   }

   public get status() {
      return this._status;
   }

   public constructor(client: HuginnClient, options?: Partial<GatewayOptions>) {
      super();
      this.options = { ...defaultClientOptions.gateway, ...options };
      this.client = client;
   }

   public connect(): void {
      log("api:gateway", "default", "connect");

      this.socket = this.options.createSocket(this.options.url);
      this.startListening();
   }

   public close(): void {
      log("api:gateway", "default", "intentional close");

      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
   }

   private onOpen(_e: Event) {
      log("api:gateway", "default", "connected");

      this.status = "connecting";
      this.emit("open", undefined);
   }

   private onClose(e: CloseEvent) {
      log("api:gateway", "default", "closed", "c:", e.code, "r:", e.reason);

      this.status = "disconnected";
      this.stopHeartbeat();
      this.emit("close", e.code);

      // Completely reset if it was intentionally closed or session was invalid
      if (e.code === GatewayCode.INTENTIONAL_CLOSE || e.code === GatewayCode.INVALID_SESSION) {
         this.sequence = undefined;
         this.sessionId = undefined;
      }

      // Don't reconnect if it was intentionally closed
      if (e.code !== GatewayCode.INTENTIONAL_CLOSE) {
         this.tryReconnect();
      }
   }

   private async tryReconnect() {
      setTimeout(async () => {
         log("api:gateway", "default", "try reconnect");

         this.status = "reconnecting";

         this.connect();

         if (this.client.user) {
            // Only authenticate if session was closed (can't resume) and it was previously authenticated
            if (this.sessionId === undefined) {
               await this.authenticate();
            }

            // If we were connected to a voice channel, update the voice state again
            if (this.client.voice.connectionInfo && this.client.voice.status === "rtc_ready") {
               // @ts-ignore It thinks when setting status to "reconnecting" here, it will stay like that
               if (this.status !== "authenticated") {
                  await this.waitForEvents(["resumed", "ready"], true);
               }

               await this.connectVoice(this.client.voice.connectionInfo.guildId, this.client.voice.connectionInfo.channelId, {
                  isAudioDeafened: this.client.voice.localVoiceState.isAudioDeafened,
                  isAudioMuted: this.client.voice.localVoiceState.isAudioMuted,
               });
            }
         }
      }, 2000);
   }

   public async authenticate(): Promise<{ authenticated: boolean; retryable: boolean }> {
      log("api:gateway", "default", "authenticate");

      // Already authenticated
      if (this.status === "authenticated") {
         return { authenticated: true, retryable: true };
      }

      // Socket is opened or is opening after a disconnect, but haven't gotten "hello" yet
      if (this.status === "connecting" || this.status === "disconnected" || this.status === "reconnecting") {
         await this.waitForEvents(["hello"]);
         this.sendIdentify();
      }
      // "hello" is already received
      else if (this.status === "connected") {
         this.sendIdentify();
      }

      // Not even opened once
      if (this.status === "none") {
         throw new Error("Gateway is never connected");
      }

      const results = await this.waitForEvents(["ready", "close"], true);

      if (results.event === "close" && typeof results.data === "number") {
         if (results.data === GatewayCode.AUTHENTICATION_FAILED) {
            return { authenticated: false, retryable: false };
         }

         return { authenticated: false, retryable: true };
      }

      return { authenticated: true, retryable: true };
   }

   /**
    * Connects to a voice channel.
    * @param guildId can be set to null if you are connecting to a direct channel call.
    * @param channelId the channel to connect to
    * @param token if a token is already available, it will use that to connect the voice websocket (use with caution)
    * @param disconnectIfConnected it will send a null channel voice state update first and then updates to the channel id and connects voice websocket
    */
   public async connectVoice(
      guildId: Snowflake | null,
      channelId: Snowflake,
      voiceState?: Omit<GatewayVoiceStateFlags, "isStreaming" | "isCameraOn">,
      token?: string,
      disconnectIfConnected?: boolean,
   ): Promise<boolean> {
      log("api:gateway", "default", "connect to voice");

      if (this.client.voice.connectionInfo && this.client.voice.connectionInfo?.channelId !== channelId) {
         this.client.voice.close();
      }

      // This is useful for when voice was disconnected and the token is no longer valid. The server won't send a new token unless it's a new channel or guild
      if (disconnectIfConnected) {
         const updateVoiceStateData: GatewayUpdateVoiceState = {
            op: GatewayOperations.VOICE_STATE_UPDATE,
            d: {
               guildId: null,
               channelId: null,
               isAudioDeafened: false,
               isAudioMuted: false,
               isStreaming: false,
               isCameraOn: false,
            },
         };

         log("api:gateway", "send", "update voice state", "cid:", updateVoiceStateData.d.channelId, "gid:", updateVoiceStateData.d.guildId);
         this.send(updateVoiceStateData);

         await new Promise<void>((r) => {
            const unlisten = this.listen("voice_state_update", (d) => {
               if (d.userId === this.client.user?.id && !d.channelId) {
                  unlisten();
                  r();
               }
            });
         });
      }

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            guildId: guildId,
            channelId: channelId,
            isAudioDeafened: voiceState?.isAudioDeafened ?? false,
            isAudioMuted: voiceState?.isAudioMuted ?? false,
            isStreaming: false,
            isCameraOn: false,
         },
      };

      log("api:gateway", "send", "update voice state", "cid:", updateVoiceStateData.d.channelId, "gid:", updateVoiceStateData.d.guildId);
      this.send(updateVoiceStateData);

      let receivedToken: string | undefined = token;

      if (!receivedToken) {
         const promise1 = new Promise<void>((r) => {
            const unlisten = this.listen("voice_server_update", (d) => {
               receivedToken = d.token;
               unlisten();
               r();
            });
         });

         const promise2 = new Promise<void>((r) => {
            const unlisten2 = this.listen("voice_state_update", (d) => {
               if (d.userId === this.client.user?.id && d.channelId) {
                  unlisten2();
                  r();
               }
            });
         });

         await Promise.allSettled([promise1, promise2]);
      }

      if (!receivedToken) {
         return false;
      }

      this.client.voice.connect(receivedToken, channelId, guildId);

      if (this.client.voice.status !== "rtc_ready") {
         await this.client.voice.waitForEvents(["ready"]);
      }

      this.client.voice.updateLocalVoiceState({ isStreaming: false, isCameraOn: false });

      return true;
   }

   public async disconnectVoice(): Promise<void> {
      log("api:gateway", "default", "disconnect from voice");

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: null,
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isStreaming: false,
            isCameraOn: false,
         },
      };

      log("api:gateway", "send", "update voice state to null");
      this.send(updateVoiceStateData);

      this.client.voice.close();

      await this.waitForEvents(["voice_state_update"]);
   }

   public async updateVoiceState(options: GatewayVoiceStateFlags): Promise<void> {
      log(
         "api:gateway",
         "default",
         "update voice state",
         "am:",
         options.isAudioMuted,
         "ad:",
         options.isAudioDeafened,
         "s:",
         options.isStreaming,
         "co:",
         options.isCameraOn,
      );

      // If we are not ready to update voice state yet, just set the local voice state and return
      if (!this.client.voice.connectionInfo || this.client.voice.status !== "rtc_ready" || this.status !== "authenticated") {
         this.client.voice.updateLocalVoiceState({ ...options });
         return;
      }

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            guildId: this.client.voice.connectionInfo?.guildId,
            channelId: this.client.voice.connectionInfo?.channelId,
            ...options,
         },
      };

      log(
         "api:gateway",
         "send",
         "update voice state",
         "am:",
         updateVoiceStateData.d.isAudioMuted,
         "ad:",
         updateVoiceStateData.d.isAudioDeafened,
         "s:",
         updateVoiceStateData.d.isStreaming,
         "co:",
         updateVoiceStateData.d.isCameraOn,
      );
      this.send(updateVoiceStateData);

      //1. We first update local voice state to immediately fire an even
      this.client.voice.updateLocalVoiceState({ ...options });

      //2. Wait for the voice state to actually get updated
      const updatedVoiceState = await new Promise<GatewayVoiceState>((r) => {
         const unlisten = this.listen("voice_state_update", (d) => {
            if (d.userId === this.client.user?.id) {
               unlisten();
               r(d);
            }
         });
      });

      //3. Then we sync it with what we got from the server
      this.client.voice.updateLocalVoiceState({ ...omit(updatedVoiceState, ["channelId", "channelId", "userId"]) });
   }

   private startListening() {
      log("api:gateway", "default", "start listening");

      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private async onMessage(e: MessageEvent) {
      if (typeof e.data !== "string") {
         error("api:gateway", "Non string messages are not yet supported");
         return;
      }

      const data: GatewayPayload = JSON.parse(e.data);

      log(
         "api:gateway",
         "recv-detail",
         "op:",
         data.op,
         "t:",
         "t" in data && data.t,
         "seq:",
         "s" in data && data.s,
         "d:",
         "d" in data && JSON.stringify(data.d),
      );

      switch (data.op) {
         case GatewayOperations.HELLO: {
            log("api:gateway", "recv", "hello", "intrvl:", data.d.heartbeatInterval);

            await this.handleHello(data);
            this.emit("hello", data.d);
            break;
         }
         case GatewayOperations.DISPATCH: {
            log("api:gateway", "dispatch", "t:", data.t, "seq:", data.s);

            this.sequence = data.s;

            if (data.t === "resumed") {
               this.handleResumed();
            }

            if (data.t === "ready") {
               this.handleReady(data.d);
            }

            this.emit(data.t, data.d);
         }
      }

      this.emit("message", data);
   }

   private async handleHello(data: GatewayHello) {
      this.status = "connected";

      this.startHeartbeat(data.d.heartbeatInterval / 2);

      // We already had a session so we try to resume it
      if (this.sequence !== undefined && this.sessionId) {
         const resumeData: GatewayResume = {
            op: GatewayOperations.RESUME,
            d: {
               token: this.client.tokenHandler.token ?? "",
               seq: this.sequence,
               sessionId: this.sessionId ?? "",
            },
         };

         log("api:gateway", "send", "resume", resumeData.d.seq);
         this.send(resumeData);
      } else {
         // No session so set the session id
         this.sessionId = data.d.sessionId;
      }
   }

   private handleResumed() {
      this.status = "authenticated";
   }

   private handleReady(data: GatewayReadyData) {
      this.status = "authenticated";
      this.client.user = data.user;
   }

   private sendIdentify() {
      const identifyData: GatewayIdentify = {
         op: GatewayOperations.IDENTIFY,
         d: {
            token: this.client.tokenHandler.token ?? "",
            intents: this.options.intents,
            properties: { os: "windows", browser: "idk", device: "idk" },
         },
      };

      log("api:gateway", "send", "identify");
      this.send(identifyData);
   }

   private startHeartbeat(interval: number) {
      log("api:gateway", "heartbeat", "start heartbeat");

      this.heartbeatInterval = setInterval(() => {
         const data: GatewayHeartbeat = { op: GatewayOperations.HEARTBEAT, d: this.sequence };
         log("api:gateway", "heartbeat", "heartbeat");
         this.send(data);
      }, interval);
   }

   private stopHeartbeat() {
      log("api:gateway", "heartbeat", "stop heartbeat");

      clearInterval(this.heartbeatInterval);
   }

   public send(data: unknown): void {
      log("api:gateway", "send-detail", "d:", JSON.stringify(data));

      this.emit("send", data as GatewayPayload);
      this.socket?.send(JSON.stringify(data));
   }
}
