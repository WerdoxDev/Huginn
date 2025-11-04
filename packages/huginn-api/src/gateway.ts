import type {
   GatewayPayload,
   GatewayStatus,
   GatewayUpdatePresenceData,
   GatewayUpdateVoiceState,
   GatewayVoiceState,
   GatewayVoiceStateFlags,
   Snowflake,
} from "@huginn/shared";
import {
   error,
   GatewayCode,
   type GatewayWebsocketEvents,
   type GatewayHeartbeat,
   type GatewayHello,
   type GatewayIdentify,
   GatewayOperations,
   type GatewayReadyData,
   type GatewayResume,
   log,
} from "@huginn/shared";
import { type HuginnClient } from ".";
import type { GatewayOptions } from "./types";
import { defaultClientOptions } from "./utils";
import { SharedWebsocket } from "./websocket";

type Events = {
   reconnected: undefined;
} & GatewayWebsocketEvents;

export class Gateway extends SharedWebsocket<Events> {
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
      if (this.status === "opening" || this.socket) {
         return;
      }

      log("api:gateway", "default", "connect");

      this.socket = this.options.createSocket(this.options.url);
      this.startListening();

      this.status = "opening";
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
      this.socket = undefined;
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
            } else {
               await this.waitForEvents(["resumed"]);
            }
            // await this.tryReconnectVoice();
         }

         this.emit("reconnected", undefined);
      }, 2000);
   }

   // private async tryReconnectVoice() {
   //    log("api:gateway", "default", "try reconnect voice");

   //    // If we were not connected to a voice channel do nothing
   //    if (!this.client.voice.connectionInfo || this.client.voice.status !== "rtc_ready") {
   //       return;
   //    }

   //    if (this.status !== "connected") {
   //       await this.waitForEvents(["hello"]);
   //    }

   //    // We need to make a copy because the server will send a null voice state when we disconnect and we don't want that to disconnect us
   //    const connectionInfo = { ...this.client.voice.connectionInfo };

   //    let callStillExists = true;
   //    if (this.status !== "authenticated") {
   //       // If we are about to reconnect, check for any call_delete from the resumed messages
   //       if (this.sequence !== undefined && this.sessionId) {
   //          const unlisten = this.listen("call_delete", (d) => {
   //             if (d.channelId === connectionInfo.channelId) {
   //                unlisten();
   //                callStillExists = false;
   //             }
   //          });

   //          await this.waitForEvents(["resumed"]);
   //          unlisten();
   //       } else {
   //          await this.waitForEvents(["ready"]);
   //       }
   //    }

   //    // If the call was removed since we disconnected, do nothing
   //    if (!callStillExists) {
   //       await this.disconnectVoice();
   //       return;
   //    }

   //    await this.connectVoice(connectionInfo.guildId, connectionInfo.channelId, {
   //       isAudioDeafened: this.client.voice.localVoiceState.isAudioDeafened,
   //       isAudioMuted: this.client.voice.localVoiceState.isAudioMuted,
   //    });
   // }

   public async authenticate(): Promise<{ authenticated: boolean; retryable: boolean }> {
      log("api:gateway", "default", "authenticate");

      // Already authenticated
      if (this.status === "authenticated") {
         return { authenticated: true, retryable: true };
      }

      // Socket is opened or is opening after a disconnect, but haven't gotten "hello" yet
      if (this.status === "connecting" || this.status === "disconnected" || this.status === "reconnecting" || this.status === "opening") {
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

   public async getVoiceToken(guildId: Snowflake | null, channelId: Snowflake, voiceState?: GatewayVoiceStateFlags): Promise<string | undefined> {
      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            guildId: guildId,
            channelId: channelId,
            isAudioDeafened: false,
            isAudioMuted: false,
            isCameraOn: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            ...voiceState,
         },
      };

      this.send(updateVoiceStateData);

      const promise1 = new Promise<string>((r) => {
         const unlisten = this.listen("voice_server_update", (d) => {
            unlisten();
            r(d.token);
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

      const [token, _] = await Promise.allSettled([promise1, promise2]);

      if (token.status === "fulfilled") {
         return token.value;
      }

      return undefined;
   }

   public async sendDefaultVoiceState(): Promise<void> {
      log("api:gateway", "default", "send default voice state");

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: null,
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      this.send(updateVoiceStateData);

      await new Promise<void>((r) => {
         const unlisten = this.listen("voice_state_update", (d) => {
            if (d.userId === this.client.user?.id) {
               unlisten();
               r();
            }
         });
      });
   }

   public async sendUpdateVoiceState(options: GatewayVoiceStateFlags, channelId: Snowflake, guildId: Snowflake | null): Promise<GatewayVoiceState> {
      log("api:gateway", "default", "update voice state", "opts:", JSON.stringify(options));

      // // If we are not ready to update voice state yet, just set the local voice state and return
      // if (!this.client.voice.connectionInfo || this.client.voice.status !== "rtc_ready" || this.status !== "authenticated") {
      //    this.client.voice.updateLocalVoiceState({ ...options });
      //    return;
      // }

      const updateVoiceStateData: GatewayPayload = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: { channelId, guildId, ...options },
      };

      log("api:gateway", "send", "update voice state", "opts:", JSON.stringify(updateVoiceStateData.d));
      this.send(updateVoiceStateData);

      const confirmed = await new Promise<GatewayVoiceState>((r) => {
         const unlisten = this.listen("voice_state_update", (d) => {
            if (d.userId === this.client.user?.id) {
               unlisten();
               r(d);
            }
         });
      });

      return confirmed;
   }

   public updatePresence(options: GatewayUpdatePresenceData): void {
      log("api:gateway", "default", "update presence", "sts:", options.status);

      if (this.status !== "authenticated") {
         return;
      }

      const updatePresenceData: GatewayPayload = {
         op: GatewayOperations.PRESENCE_UPDATE,
         d: { status: options.status, activities: options.activities },
      };

      log("api:gateway", "send", "update presence", "sts:", options.status);
      this.send(updatePresenceData);
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

            switch (data.t) {
               case "ready":
                  this.handleReady(data.d);
                  break;
               case "resumed":
                  this.handleResumed();
                  break;
            }

            // Maybe the server or we sent an update to disconnect from the voice. We should close voice websocket just in case
            // We also check if we are authenticated. so any disconnects from resuming shouldn't count
            // if (data.t === "voice_state_update" && this.status === "authenticated") {
            //    if (!data.d.channelId && data.d.userId === this.client.user?.id) {
            //       log("api:gateway", "default", "server voice state update says close voice");
            //       this.client.voice.signaling.close();
            //    }
            // }

            this.emit(data.t, data.d);
         }
      }

      this.emit("message", data);
   }

   private async handleHello(data: GatewayHello) {
      this.status = "connected";

      this.startHeartbeat(data.d.heartbeatInterval);

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
