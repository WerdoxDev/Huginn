import type {
   GatewayPayload,
   GatewayUpdateVoiceState, Snowflake,
   WebsocketStatus
} from "@huginn/shared";
import {
   error,
   GatewayCode,
   type GatewayEvents,
   type GatewayHeartbeat,
   type GatewayHello,
   type GatewayIdentify,
   GatewayOperations,
   type GatewayReadyData,
   type GatewayResume, isOpcode,
   log
} from "@huginn/shared";
import type { HuginnClient } from ".";
import type { GatewayOptions } from "./types";
import { defaultClientOptions } from "./utils";
import { SharedWebsocket } from "./websocket";

export class Gateway extends SharedWebsocket<GatewayEvents> {
   public readonly options: GatewayOptions;
   private readonly client: HuginnClient;

   public socket?: WebSocket;
   public readyData?: GatewayReadyData;
   public sessionId?: Snowflake;

   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private sequence?: number;

   private _status: WebsocketStatus = "disconnected";
   public set status(newStatus: WebsocketStatus) {
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
      log("api:gateway", "default", "connect")

      this.socket = this.options.createSocket(this.options.url);
      this.startListening();
   }

   public close(): void {
      log("api:gateway", "default", "intentional close")

      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
      this.sequence = undefined;
      this.sessionId = undefined;
   }

   private onOpen(_e: Event) {
      log("api:gateway", "default", "connected")

      this.status = "connecting"
      this.emit("open", undefined);
   }

   private onClose(e: CloseEvent) {
      log("api:gateway", "default", "closed", "c:", e.code, "r:", e.reason)

      this.status = "disconnected";
      this.stopHeartbeat();
      this.emit("close", e.code);

      // Completely reset if it was intentionally closed
      if (e.code === GatewayCode.INTENTIONAL_CLOSE) {
         this.readyData = undefined;
         this.sequence = undefined;
         this.sessionId = undefined;
         return;
      }

      // Only reset sequence and session id if it was invalid. (readyData can still be defined)
      if (e.code === GatewayCode.INVALID_SESSION) {
         this.sequence = undefined;
         this.sessionId = undefined;
      }

      this.tryReconnect();
   }

   private async tryReconnect() {
      setTimeout(async () => {
         log("api:gateway", "default", "try reconnect");

         this.status = "reconnecting";

         this.connect();

         console.log(this.client.user, this.sessionId);
         // Only authenticate if session was closed and it was previously authenticated
         if (this.client.user && !this.sessionId) {
            await this.waitForEvents(["hello"]);
            await this.authenticate();
         }
      }, 2000);
   }

   public async authenticate(): Promise<{ authenticated: boolean, retryable: boolean }> {
      log("api:gateway", "default", "authenticate")

      // Already authenticated
      if (this.status === "authenticated") {
         console.log("AUTHED");
         return { authenticated: true, retryable: false };
      }

      // Socket is opened/ is opening, but haven't gotten "hello" yet
      if (this.status === "connecting" || this.status === "disconnected") {
         await this.waitForEvents(["hello"]);
         this.sendIdentify();

      }
      // "hello" is already received
      else if (this.status === "connected") {
         this.sendIdentify();
      }

      const results = await this.waitForEvents(["ready", "close"], true);

      if (results.event === "close" && typeof results.data === "number") {
         if (results.data === GatewayCode.AUTHENTICATION_FAILED) {
            return { authenticated: false, retryable: false };
         }

         return { authenticated: false, retryable: true };
      }

      return { authenticated: true, retryable: false };

      // // the socket was closed
      // if (this.status === "disconnected") {
      //    return;
      // }
   }

   /**
    * Connects to a voice channel.
    * @param guildId can be set to null if you are connecting to a direct channel call.
    */
   public async connectVoice(guildId: Snowflake | null, channelId: Snowflake, token?: string): Promise<void> {
      log("api:gateway", "default", "connect to voice")

      if (this.client.voice.connectionInfo?.channelId !== channelId) {
         this.client.voice.close();
      }

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            guildId: guildId,
            channelId: channelId,
            selfDeaf: false,
            selfMute: false,
            selfStream: false,
            selfVideo: false,
         },
      };

      log("api:gateway", "send", "update voice state", "cid:", updateVoiceStateData.d.channelId, "gid:", updateVoiceStateData.d.guildId);
      this.send(updateVoiceStateData);

      let receivedToken: string | undefined = token;

      const promise1 = new Promise<void>((resolve) => {
         const unlisten = this.listen("voice_server_update", (d) => {
            receivedToken = d.token;
            unlisten();
            resolve();
         });
      });

      const promise2 = new Promise<void>((resolve) => {
         const unlisten2 = this.listen("voice_state_update", (_d) => {
            unlisten2();
            resolve();
         });
      });

      if (!receivedToken) {
         await Promise.allSettled([promise1, promise2]);
      }

      if (!receivedToken) {
         return;
      }

      this.client.voice.connect(receivedToken, channelId, guildId);
   }

   public async disconnectVoice(): Promise<void> {
      log("api:gateway", "default", "disconnect from voice")

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: null,
            guildId: null,
            selfDeaf: false,
            selfMute: false,
            selfStream: false,
            selfVideo: false,
         },
      };

      log("api:gateway", "send", "update voice state to null");
      this.send(updateVoiceStateData);

      this.client.voice.close();

      await new Promise<void>((resolve, _reject) => {
         const onMessage = (data: GatewayPayload) => {
            if (isOpcode(data, GatewayOperations.DISPATCH)) {
               if (data.t === "voice_state_update") {
                  this.off("message", onMessage);
                  resolve();
               }
            }
         };

         this.on("message", onMessage);
      });
   }

   public updateVoiceState(selfMute: boolean, selfDeaf: boolean, selfStream: boolean, selfVideo: boolean): void {
      log("api:gateway", "default", "update voice state", "sm:", selfMute, "sd:", selfDeaf, "ss:", selfStream, "sv:", selfVideo);

      if (!this.client.voice.connectionInfo) {
         return;
      }

      const updateVoiceStateData: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            guildId: this.client.voice.connectionInfo?.guildId,
            channelId: this.client.voice.connectionInfo?.channelId,
            selfMute: selfMute,
            selfDeaf: selfDeaf,
            selfStream: selfStream,
            selfVideo: selfVideo,
         },
      };

      log("api:gateway", "send", "update voice state", "sm:", updateVoiceStateData.d.selfMute, "sd:", updateVoiceStateData.d.selfDeaf, "ss:", updateVoiceStateData.d.selfStream, "sv:", updateVoiceStateData.d.selfVideo);
      this.send(updateVoiceStateData);

      this.client.voice.updateLocalVoiceState({ audioMuted: selfMute, consumersMuted: selfDeaf, streaming: selfStream, camera: selfVideo })
   }

   private startListening() {
      log("api:gateway", "default", "start listening")

      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private async onMessage(e: MessageEvent) {
      if (typeof e.data !== "string") {
         error("api:gateway", "Non string messages are not yet supported")
         return;
      }

      const data: GatewayPayload = JSON.parse(e.data);

      log("api:gateway", "recv-detail", "op:", data.op, "t:", "t" in data && data.t, "seq:", "s" in data && data.s, "d:", "d" in data && data.d)

      switch (data.op) {
         case GatewayOperations.HELLO: {
            log("api:gateway", "recv", "hello", "intrvl:", data.d.heartbeatInterval)

            await this.handleHello(data);
            this.emit("hello", data.d);
            break;
         }
         case GatewayOperations.DISPATCH: {
            log("api:gateway", "dispatch", "t:", data.t, "seq:", data.s)

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

      console.log(this.sequence, this.sessionId)
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

      this.readyData = data;
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
      log("api:gateway", "send-detail", "d:", data);

      this.socket?.send(JSON.stringify(data));
   }
}
