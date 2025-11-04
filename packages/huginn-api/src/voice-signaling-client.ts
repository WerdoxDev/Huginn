import {
   constants,
   error,
   GatewayCode,
   log,
   VoiceOperations,
   type HMediaKind,
   type Snowflake,
   type VoiceConsumerClosedData,
   type VoiceConsumerCreatedData,
   type VoiceConsumerResumedData,
   type VoiceHeartbeat,
   type VoiceHelloData,
   type VoiceIdentify,
   type VoiceNewProducerData,
   type VoicePayload,
   type VoicePing,
   type VoiceProducerClosedData,
   type VoiceProducerCreatedData,
   type VoiceReadyData,
   type VoiceTransportConnectedData,
   type VoiceTransportCreatedData,
} from "@huginn/shared";
import { EventEmitter } from "./event-emitter";
import type { HuginnClient, VoiceConnectionData, VoiceOptions } from ".";
import type { DtlsParameters, RtpCapabilities, RtpParameters } from "mediasoup-client/types";

type SignalingClientStatus = "connecting" | "connected" | "helloed" | "authenticated" | "disconnected" | "idle";

type Events = {
   ready: VoiceReadyData;
   transport_created: VoiceTransportCreatedData;
   transport_connected: VoiceTransportConnectedData;

   connected: undefined;
   disconnected: undefined;
   status_changed: SignalingClientStatus;
   pong: { rtt: number };

   producer_created: VoiceProducerCreatedData;
   new_producer: VoiceNewProducerData;
   producer_closed: VoiceProducerClosedData;

   consumer_created: VoiceConsumerCreatedData;
   consumer_resumed: VoiceConsumerResumedData;
   consumer_closed: VoiceConsumerClosedData;

   reset: { hard: boolean };
};

export class VoiceSignalingClient extends EventEmitter<Events> {
   private client: HuginnClient;
   private options: VoiceOptions;
   public socket?: WebSocket;
   public connectionData?: VoiceConnectionData;
   private intentionalClose = false;

   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private pingTimeout?: ReturnType<typeof setTimeout>;

   private sequence?: number;
   private lastPingStart?: number;

   private _status: SignalingClientStatus = "idle";
   public get status(): SignalingClientStatus {
      return this._status;
   }

   public constructor(client: HuginnClient, options: VoiceOptions) {
      super();
      this.client = client;
      this.options = options;
   }

   public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
      log("api:voice-signaling", "default", "connect", "cid:", channelId, "gid:", guildId);

      if (this.socket && (this.status === "idle" || this.status === "connecting")) {
         throw new Error("Socket is already connected or is connecting");
      }

      this.intentionalClose = false;
      this.connectionData = { token, channelId, guildId };
      this.setStatus("connecting");
      this.socket = this.options.createSocket(this.options.url);

      this.socket.onopen = () => this.onOpen();
      this.socket.onclose = (e) => this.onClose(e);
      this.socket.onmessage = (e) => this.onMessage(e);
      this.socket.onerror = (e) => {
         error("api:voice-signaling", "websocket error:", e);
      };
   }

   public close(): void {
      log("api:voice-signaling", "default", "close");

      this.intentionalClose = true;
      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
      this.hardReset();
   }

   private onOpen(): void {
      log("api:voice-signaling", "default", "connected");

      this.setStatus("connected");
      this.emit("connected", undefined);
   }

   private onClose(e: CloseEvent): void {
      log("api:voice-signaling", "default", "closed", "c:", e.code, "r:", e.reason);

      if (!this.intentionalClose) {
         this.softReset();
         this.setStatus("disconnected");
         this.emit("disconnected", undefined);

         window.setTimeout(() => {
            this.tryReconnect();
         }, 1000);
      }
   }

   private async tryReconnect() {
      if (!this.connectionData) throw new Error("Connection Data cannot be undefined when reconnecting voice");

      this.connect(this.connectionData.token, this.connectionData.channelId, this.connectionData.guildId);
   }

   private async onMessage(e: MessageEvent): Promise<void> {
      const data: VoicePayload = JSON.parse(e.data);

      if (data.op === VoiceOperations.DISPATCH) {
         log("api:voice-signaling", "recv", "op:", data.op, "t:", data.t);
         log("api:voice-signaling", "recv-detail", "op:", data.op, "t:", data.t, "d:", data.d);
      } else {
         log("api:voice-signaling", "recv", "op:", data.op);
      }

      switch (data.op) {
         case VoiceOperations.HELLO:
            this.onHello(data.d);
            break;
         case VoiceOperations.DISPATCH:
            switch (data.t) {
               case "ready":
                  await this.onReady(data.d);
                  break;

               case "transport_created":
                  this.emit("transport_created", data.d);
                  break;
               case "transport_connected":
                  this.emit("transport_connected", data.d);
                  break;

               case "producer_created":
                  this.emit("producer_created", data.d);
                  break;
               case "producer_closed":
                  this.emit("producer_closed", data.d);
                  break;
               case "new_producer":
                  this.emit("new_producer", data.d);
                  break;

               case "consumer_created":
                  this.emit("consumer_created", data.d);
                  break;
               case "consumer_resumed":
                  this.emit("consumer_resumed", data.d);
                  break;
               case "consumer_closed":
                  this.emit("consumer_closed", data.d);
                  break;
            }

            // this.emit(data.t, data.d);

            break;
         case VoiceOperations.PONG:
            this.onPong();
            break;
         // case VoiceOperations.PING:
      }
   }

   private onHello(data: VoiceHelloData) {
      this.setStatus("helloed");
      this.startHeartbeatInterval(data.heartbeatInterval);

      if (!this.client.currentUser || !this.connectionData) throw new Error("Tried to identify websocket either without user or connection data");

      const identify: VoiceIdentify = {
         op: VoiceOperations.IDENTIFY,
         d: {
            token: this.connectionData.token,
            channelId: this.connectionData.channelId,
            guildId: this.connectionData.guildId,
         },
      };

      this.send(identify);
   }

   private async onReady(data: VoiceReadyData) {
      this.setStatus("authenticated");
      this.sendPing();
      this.emit("ready", data);
   }

   private onPong() {
      const rtt = Date.now() - (this.lastPingStart ?? 0);

      log("api:voice-signaling", "ping", "pong", "now:", Date.now(), "rtt:", rtt);

      this.pingTimeout = setTimeout(() => {
         this.sendPing();
      }, constants.VOICE_CLIENT_PING_INTERVAL);

      this.emit("pong", { rtt });
   }

   private startHeartbeatInterval(interval: number) {
      log("api:voice-signaling", "heartbeat", "start heartbeat");

      this.heartbeatInterval = setInterval(() => {
         const data: VoiceHeartbeat = { op: VoiceOperations.HEARTBEAT, d: this.sequence };

         log("api:voice-signaling", "heartbeat", "heartbeat", "seq:", this.sequence);
         this.send(data);
      }, interval);
   }

   private setStatus(newStatus: SignalingClientStatus) {
      if (this._status !== newStatus) {
         this._status = newStatus;
         this.emit("status_changed", newStatus);
      }
   }

   private send(data: VoicePayload): void {
      this.socket?.send(JSON.stringify(data));
      if (data.op === VoiceOperations.DISPATCH) {
         log("api:voice-signaling", "send", "op:", data.op, "t:", data.t);
         log("api:voice-signaling", "send-detail", "op:", data.op, "t:", data.t, "d:", data.d);
      } else {
         log("api:voice-signaling", "send", "op:", data.op);
      }
   }

   private sendPing() {
      const pingData: VoicePing = { op: VoiceOperations.PING };
      this.lastPingStart = Date.now();

      this.send(pingData);
   }

   public softReset(emitEvent = true): void {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
         this.socket.close();
      }

      this.socket = undefined;
      clearInterval(this.heartbeatInterval);
      clearInterval(this.pingTimeout);
      this.sequence = undefined;

      if (emitEvent) {
         this.emit("reset", { hard: false });
      }
   }

   public hardReset(): void {
      this.softReset(false);
      this.connectionData = undefined;
      this.setStatus("idle");

      this.emit("reset", { hard: true });
   }

   public checkStatus(): asserts this is this & { connectionData: VoiceConnectionData } {
      if (!this.connectionData || this.status !== "authenticated") {
         throw new Error("Voice signaling is not fully initialized");
      }
   }

   public sendCreateTransports(): void {
      this.checkStatus();

      const createSendTransportData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "create_transport",
         d: { channelId: this.connectionData.channelId, direction: "send" },
      };

      const createRecvTransportData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "create_transport",
         d: { channelId: this.connectionData?.channelId, direction: "recv" },
      };

      this.send(createSendTransportData);
      this.send(createRecvTransportData);
   }

   public async sendConnectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "connect transport", "tid:", transportId, "cid:", channelId);

      const connectTransportData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "connect_transport",
         d: { channelId, transportId, dtlsParameters },
      };

      this.send(connectTransportData);

      // Wait for the transport to get connected
      await new Promise<void>((r) => {
         const unlisten = this.listen("transport_connected", (d) => {
            if (d.transportId === transportId) {
               unlisten();
               r();
            }
         });
      });
   }

   public async sendCreateProducer(kind: HMediaKind, transportId: string, rtpParameters: RtpParameters): Promise<string> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "create producer", "knd:", kind, "tid:", transportId, "cid:", channelId);

      const produceData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "produce",
         d: { channelId, transportId, kind, rtpParameters },
      };

      this.send(produceData);

      // Wait for the producer to be created
      const { producerId } = await new Promise<VoiceProducerCreatedData>((r) => {
         const unlisten = this.listen("producer_created", (d) => {
            if (d.kind === kind) {
               unlisten();
               r(d);
            }
         });
      });

      return producerId;
   }

   public async sendCloseProducer(producerId: string): Promise<void> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "close producer", "pid:", producerId, "cid:", channelId);

      const closeProducerData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "close_producer",
         d: { channelId, producerId },
      };

      this.send(closeProducerData);

      await new Promise<void>((r) => {
         const unlisten = this.listen("producer_closed", (d) => {
            if (d.producerId === producerId) {
               unlisten();
               r();
            }
         });
      });
   }

   public async sendCreateConsumer(producerId: string, transportId: string, rtpCapabilities: RtpCapabilities): Promise<VoiceConsumerCreatedData> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "create consumer", "pid:", producerId, "tid:", transportId, "cid:", channelId);

      const consumeData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "consume",
         d: { channelId, producerId, rtpCapabilities, transportId },
      };

      this.send(consumeData);

      // Wait for the consumer to be created
      const result = await new Promise<VoiceConsumerCreatedData>((r) => {
         const unlisten = this.listen("consumer_created", (d) => {
            if (d.producerId === producerId) {
               unlisten();
               r(d);
            }
         });
      });

      return result;
   }

   public async sendResumeConsumer(consumerId: string): Promise<void> {
      this.checkStatus();
      const channelId = this.connectionData.channelId;

      log("api:voice-signaling", "default", "resume consumer", "cid:", consumerId);

      const resumeConsumerData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "resume_consumer",
         d: { channelId: channelId, consumerId },
      };

      this.send(resumeConsumerData);

      await new Promise<void>((r) => {
         const unlisten = this.listen("consumer_resumed", (d) => {
            if (d.consumerId === consumerId) {
               unlisten();
               r();
            }
         });
      });
   }

   public async sendCloseConsumer(consumerId: string): Promise<void> {
      this.checkStatus();
      const channelId = this.connectionData.channelId;

      log("api:voice-signaling", "default", "close consumer", "cid:", consumerId);

      const closeConsumerData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "close_consumer",
         d: { channelId, consumerId },
      };

      this.send(closeConsumerData);

      await new Promise<void>((r) => {
         const unlisten = this.listen("consumer_closed", (d) => {
            if (d.consumerId === consumerId) {
               unlisten();
               r();
            }
         });
      });
   }
}
