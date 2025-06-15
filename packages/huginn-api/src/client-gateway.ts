import {
   GatewayCode,
   type GatewayEvents,
   type GatewayHeartbeat,
   type GatewayHello,
   type GatewayIdentify,
   GatewayOperations,
   type GatewayReadyData,
   type GatewayResume,
   error,
   log,
} from "@huginn/shared";
import type {
   GatewayDispatch,
   GatewayPayload,
   GatewayResumedData,
   GatewayUpdateVoiceState,
   GatewayVoiceServerUpdateData,
   GatewayVoiceStateUpdateData,
   Snowflake,
} from "@huginn/shared";
import { isOpcode } from "@huginn/shared";
import type { HuginnClient } from ".";
import { EventEmitterWithHistory } from "./event-emitter";
import { ClientReadyState, type GatewayOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Gateway extends EventEmitterWithHistory<GatewayEvents> {
   public readonly options: GatewayOptions;
   private readonly client: HuginnClient;

   public socket?: WebSocket;
   public readyData?: GatewayReadyData;
   public sessionId?: Snowflake;

   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private sequence?: number;

   public constructor(client: HuginnClient, options?: Partial<GatewayOptions>) {
      super();
      this.options = { ...defaultClientOptions.gateway, ...options };
      this.client = client;
   }

   public connect(): void {
      log("api:gateway", "api:gateway-default", "connect")

      this.socket = this.options.createSocket(this.options.url);
      this.startListening();
   }

   public async authenticate(): Promise<boolean> {
      if (this.socket?.readyState !== WebSocket.OPEN && this.socket?.readyState !== WebSocket.CONNECTING) {
         return false;
      }

      log("api:gateway", "api:gateway-default", "authenticate")

      const result = await new Promise((r) => {
         if (this.client.user && this.client.readyState === ClientReadyState.READY) {
            r(true);
         } else {
            const onMessage = (data: GatewayPayload) => {
               if (isOpcode(data, GatewayOperations.HELLO)) {
                  this.sendIdentify();
               }

               if (isOpcode(data, GatewayOperations.DISPATCH)) {
                  if (data.t === "ready") {
                     r(true);

                     this.off("message", onMessage);
                  }
               }
            };

            const onClose = () => {
               r(false);
               this.off("message", onMessage);
               this.socket?.removeEventListener("close", onClose);
            };

            this.on("message", onMessage);
            this.socket?.addEventListener("close", onClose);
         }
      });

      if (!result) {
         return false;
      }

      return true;
   }

   /**
    * Connects to a voice channel.
    * @param guildId can be set to null if you are connecting to a direct channel call.
    */
   public async connectToVoice(guildId: Snowflake | null, channelId: Snowflake): Promise<void> {
      log("api:gateway", "api:gateway-default", "connect to voice")

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

      log("api:gateway", "api:gateway-send", "update voice state", "cid:", updateVoiceStateData.d.channelId, "gid:", updateVoiceStateData.d.guildId);
      this.send(updateVoiceStateData);

      const token = await new Promise<string>((resolve, reject) => {
         let count = 0;
         let token: string;
         const onMessage = (data: GatewayPayload) => {
            if (isOpcode(data, GatewayOperations.DISPATCH)) {
               if (data.t === "voice_server_update") {
                  const dispatch = data.d as GatewayVoiceServerUpdateData;
                  token = dispatch.token;

                  count++;
               } else if (data.t === "voice_state_update") {
                  const d = data.d as GatewayVoiceStateUpdateData;
                  if (d.userId === this.client.user?.id) {
                     count++;
                  }
               }

               if (count === 2) {
                  this.off("message", onMessage);
                  resolve(token);
               }
            }
         };

         this.on("message", onMessage);
      });

      this.client.voice.connect(token, channelId, guildId);
   }

   public disconnectFromVoice(): void {
      log("api:gateway", "api:gateway-default", "disconnect from voice")

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

      log("api:gateway", "api:gateway-send", "update voice state to null");
      this.send(updateVoiceStateData);

      this.client.voice.close();
   }

   public updateVoiceState(selfMute: boolean, selfDeaf: boolean, selfStream: boolean, selfVideo: boolean): void {
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

      log("api:gateway", "api:gateway-send", "update voice state", "sm:", updateVoiceStateData.d.selfMute, "sd:", updateVoiceStateData.d.selfDeaf, "ss:", updateVoiceStateData.d.selfStream, "sv:", updateVoiceStateData.d.selfVideo);
      this.send(updateVoiceStateData);

      if (selfMute) {
         this.client.voice.muteMicrophone();
      } else {
         this.client.voice.unmuteMicrophone();
      }

      if (selfDeaf) {
         this.client.voice.muteConsumers();
      } else {
         this.client.voice.unmuteConsumers();
      }
   }

   private startListening() {
      log("api:gateway", "api:gateway-default", "start listening")

      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private onOpen(_e: Event) {
      log("api:gateway", "api:gateway-default", "connected")

      this.emit("open", undefined);
   }

   private onClose(e: CloseEvent) {
      log("api:gateway", "api:gateway-default", "closed", "c:", e.code, "r:", e.reason)

      this.stopHeartbeat();
      this.emit("close", e.code);

      this.readyData = undefined;

      if (e.code === GatewayCode.INTENTIONAL_CLOSE) {
         return;
      }

      this.tryReconnect(e);
   }

   private async tryReconnect(event: CloseEvent) {
      setTimeout(async () => {
         log("api:gateway", "api:gateway-default", "try reconnect");

         this.client.readyState = ClientReadyState.RECONNECRING;

         if (event.code === GatewayCode.INVALID_SESSION) {
            this.sequence = undefined;
            this.sessionId = undefined;
         }

         this.connect();

         if (this.client.user) {
            await this.authenticate();
         }
      }, 2000);
   }

   private async onMessage(e: MessageEvent) {
      if (typeof e.data !== "string") {
         error("api:gateway", "Non string messages are not yet supported")
         return;
      }

      const data: GatewayPayload = JSON.parse(e.data);

      switch (data.op) {
         case GatewayOperations.HELLO: {
            const hello = data as GatewayHello;
            await this.handleHello(hello);
            log("api:gateway", "api:gateway-recv", "hello", "intrvl:", hello.d.heartbeatInterval)
            this.emit("hello", hello.d);
            break;
         }
         case GatewayOperations.DISPATCH: {
            this.sequence = data.s;
            const dispatch = data as GatewayDispatch;

            if (dispatch.t === "resumed") {
               this.sessionId = (dispatch.d as GatewayResumedData).sessionId;
            }

            if (dispatch.t === "ready") {
               this.handleReady(dispatch.d as GatewayReadyData);
            }

            log("api:gateway", "api:gateway-dispatch", "t:", data.t, "seq:", data.s)

            this.emit(dispatch.t, dispatch.d);
         }
      }

      this.emit("message", data);
   }

   public close(): void {
      log("api:gateway", "api:gateway-default", "intentional close")

      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
      this.sequence = undefined;
      this.sessionId = undefined;
   }

   private async handleHello(data: GatewayHello) {
      this.sessionId = data.d.sessionId;
      this.startHeartbeat(data.d.heartbeatInterval);

      if (this.sequence && this.sessionId) {
         const resumeData: GatewayResume = {
            op: GatewayOperations.RESUME,
            d: {
               token: this.client.tokenHandler.token ?? "",
               seq: this.sequence,
               sessionId: this.sessionId ?? "",
            },
         };

         log("api:gateway", "api:gateway-send", "resume", resumeData.d.seq);
         this.send(resumeData);
      }
   }

   private handleReady(data: GatewayReadyData) {
      this.client.user = data.user;

      this.readyData = data;

      this.client.readyState = ClientReadyState.READY;
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

      log("api:gateway", "api:gateway-send", "identify");
      this.send(identifyData);
   }

   private startHeartbeat(interval: number) {
      this.heartbeatInterval = setInterval(() => {
         const data: GatewayHeartbeat = { op: GatewayOperations.HEARTBEAT, d: this.sequence };
         log("api:gateway", "api:gateway-heartbeat", "heartbeat");
         this.send(data);
      }, interval);
      log("api:gateway", "api:gateway-heartbeat", "start heartbeat");
   }

   private stopHeartbeat() {
      clearInterval(this.heartbeatInterval);
      log("api:gateway", "api:gateway-heartbeat", "stop heartbeat");
   }

   public send(data: unknown): void {
      this.socket?.send(JSON.stringify(data));
   }
}
