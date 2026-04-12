import type { DtlsParameters, RtpCapabilities, RtpParameters } from "mediasoup-client/types";

import {
   CONSTANTS,
   error,
   EventEmitter,
   GatewayCode,
   log,
   VoiceOperations,
   VoiceSignallingError,
   type HMediaKind,
   type Snowflake,
   type VoiceCloseConsumerResult,
   type VoiceCloseProducerResult,
   type VoiceConnectTransportResult,
   type VoiceConsumeResultData,
   type VoiceCreateTransportData,
   type VoiceCreateTransportResult,
   type VoiceError,
   type VoiceHeartbeat,
   type VoiceHelloData,
   type VoicePayload,
   type VoicePing,
   type VoiceProduceResult,
   type VoiceReadyData,
   type VoiceRestartIceResult,
   type VoiceResumeConsumerResult,
   type VoiceWebsocketEvents,
} from "@huginn/shared";

import type { HuginnClient, VoiceConnectionData, VoiceOptions, VoiceSignallingResetType } from ".";

type SignalingClientStatus = "connecting" | "connected" | "helloed" | "authenticated" | "resuming" | "disconnected" | "idle";

type Events = {
   connected: undefined;
   disconnected: undefined;
   status_changed: SignalingClientStatus;

   pong: { rtt: number };

   reset: { type: VoiceSignallingResetType };
} & VoiceWebsocketEvents;

export class VoiceSignalingClient extends EventEmitter<Events> {
   private client: HuginnClient;
   private options: VoiceOptions;
   public socket?: WebSocket;
   public connectionData?: VoiceConnectionData;
   private intentionalClose = false;

   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private pingTimeout?: ReturnType<typeof setTimeout>;

   private sequence?: number;
   private sessionId?: Snowflake;
   private lastPingStart?: number;

   private _status: SignalingClientStatus = "idle";
   public get status(): SignalingClientStatus {
      return this._status;
   }

   public get canResume(): boolean {
      return !!this.connectionData && !!this.sessionId && this.sequence !== undefined;
   }

   public constructor(client: HuginnClient, options: VoiceOptions) {
      super();
      this.client = client;
      this.options = options;
   }

   public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
      log("api:voice-signaling", "default", "connect", "cid:", channelId, "gid:", guildId);

      if (this.status !== "idle" && this.status !== "disconnected") {
         throw new Error("Voice socket is already connected or is connecting");
      }

      this.intentionalClose = false;
      this.connectionData = { token, channelId, guildId };
      this.setStatus("connecting");
      this.socket = this.options.createSocket(this.options.url);

      this.socket.onopen = () => this.onOpen();
      this.socket.onclose = (e) => this.onClose(e);
      this.socket.onmessage = (e) => this.onMessage(e);
      this.socket.onerror = (e) => {
         error("api:gateway", "voice websocket encountered an error");
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

      // Server told us to disconnect but we didn't intentionally disconnect
      if (!this.intentionalClose && e.code === GatewayCode.INTENTIONAL_CLOSE) {
         this.hardReset();
      }

      if (!this.intentionalClose && e.code !== GatewayCode.INTENTIONAL_CLOSE) {
         if (e.code === GatewayCode.INVALID_SESSION || e.code === GatewayCode.AUTHENTICATION_FAILED) {
            this.resetSession();
         } else {
            this.softReset();
         }

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
         if ("d" in data) {
            log("api:voice-signaling", "recv-detail", "op:", data.op, "d:", data.d);
         }
      }

      switch (data.op) {
         case VoiceOperations.HELLO:
            this.onHello(data.d);
            break;
         case VoiceOperations.DISPATCH:
            this.sequence = data.s;

            switch (data.t) {
               case "ready":
                  await this.onReady(data.d);
                  break;
               case "resumed":
                  await this.onResumed();
                  break;

               case "create_transport_result":
                  this.emit("create_transport_result", data.d);
                  break;
               case "connect_transport_result":
                  this.emit("connect_transport_result", data.d);
                  break;
               case "restart_ice_result":
                  this.emit("restart_ice_result", data.d);
                  break;

               case "produce_result":
                  this.emit("produce_result", data.d);
                  break;
               case "close_producer_result":
                  this.emit("close_producer_result", data.d);
                  break;

               case "producer_created":
                  this.emit("producer_created", data.d);
                  break;
               case "producer_closed":
                  this.emit("producer_closed", data.d);
                  break;

               case "consume_result":
                  this.emit("consume_result", data.d);
                  break;
               case "resume_consumer_result":
                  this.emit("resume_consumer_result", data.d);
                  break;
               case "close_consumer_result":
                  this.emit("close_consumer_result", data.d);
                  break;

               case "consumer_created":
                  this.emit("consumer_created", data.d);
                  break;
               case "consumer_closed":
                  this.emit("consumer_closed", data.d);
                  break;

               case "peer_left":
                  this.emit("peer_left", data.d);
                  break;
            }

            break;
         case VoiceOperations.PONG:
            this.onPong();
            break;
      }
   }

   private onHello(data: VoiceHelloData) {
      this.setStatus("helloed");
      this.startHeartbeatInterval(data.heartbeatInterval);

      if (!this.sessionId) {
         this.sessionId = data.sessionId;
      }

      if (!this.client.currentUser || !this.connectionData) {
         throw new Error("Tried to identify/resume voice websocket either without user or connection data");
      }

      if (this.canResume) {
         this.setStatus("resuming");
         this.send({
            op: VoiceOperations.RESUME,
            d: {
               token: this.connectionData.token,
               sessionId: this.sessionId!,
               seq: this.sequence!,
            },
         });
      } else {
         this.send({
            op: VoiceOperations.IDENTIFY,
            d: {
               token: this.connectionData.token,
               channelId: this.connectionData.channelId,
               guildId: this.connectionData.guildId,
            },
         });
      }
   }

   private async onReady(data: VoiceReadyData) {
      this.setStatus("authenticated");
      this.sendPing();
      this.emit("ready", data);
   }

   private async onResumed() {
      this.setStatus("authenticated");
      this.sendPing();
   }

   private onPong() {
      const rtt = Date.now() - (this.lastPingStart ?? 0);

      log("api:voice-signaling", "ping", "pong", "now:", Date.now(), "rtt:", rtt);

      this.pingTimeout = setTimeout(() => {
         this.sendPing();
      }, CONSTANTS.VOICE_CLIENT_PING_INTERVAL);

      this.emit("pong", { rtt });
   }

   private startHeartbeatInterval(interval: number) {
      log("api:voice-signaling", "heartbeat", "start heartbeat");

      this.heartbeatInterval = setInterval(() => {
         log("api:voice-signaling", "heartbeat", "sent", "seq:", this.sequence);

         this.send({ op: VoiceOperations.HEARTBEAT, d: this.sequence });
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
      this.lastPingStart = Date.now();
      this.send({ op: VoiceOperations.PING });
   }

   public softReset(emitEvent = true): void {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
         this.socket.close();
      }

      this.socket = undefined;
      clearInterval(this.heartbeatInterval);
      clearInterval(this.pingTimeout);

      if (emitEvent) this.emit("reset", { type: "soft" });
   }

   public hardReset(): void {
      this.softReset(false);
      this.resetSession(false);
      this.connectionData = undefined;
      this.setStatus("idle");

      this.emit("reset", { type: "hard" });
   }

   private resetSession(emitEvent = true): void {
      this.sessionId = undefined;
      this.sequence = undefined;

      if (emitEvent) this.emit("reset", { type: "session" });
   }

   public checkStatus(): asserts this is this & { connectionData: VoiceConnectionData } {
      if (!this.connectionData || (this.status !== "authenticated" && this.status && this.status !== "resuming")) {
         throw new Error("Voice signaling is not fully initialized");
      }
   }

   public async sendCreateTransport(direction: "send" | "recv"): Promise<VoiceCreateTransportResult> {
      this.checkStatus();

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "create_transport",
         d: { channelId: this.connectionData.channelId, direction, nonce },
      });

      return await new Promise<VoiceCreateTransportResult>((res) => {
         const unlisten = this.listen("create_transport_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }

   public async sendConnectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<VoiceConnectTransportResult> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "connect transport", "tid:", transportId, "cid:", channelId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "connect_transport",
         d: { channelId, transportId, dtlsParameters, nonce },
      });

      // Wait for the transport to get connected
      return await new Promise<VoiceConnectTransportResult>((res) => {
         const unlisten = this.listen("connect_transport_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }

   public async sendCreateProducer(kind: HMediaKind, transportId: string, rtpParameters: RtpParameters): Promise<VoiceProduceResult> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "create producer", "knd:", kind, "tid:", transportId, "cid:", channelId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "produce",
         d: { channelId, transportId, kind, rtpParameters, nonce },
      });

      // Wait for the producer to be created
      return await new Promise<VoiceProduceResult>((res) => {
         const unlisten = this.listen("produce_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }

   public async sendCloseProducer(producerId: string): Promise<VoiceCloseProducerResult> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "close producer", "pid:", producerId, "cid:", channelId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "close_producer",
         d: { producerId, channelId, nonce },
      });

      return await new Promise<VoiceCloseProducerResult>((res) => {
         const unlisten = this.listen("close_producer_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }

   public async sendCreateConsumer(producerId: string, transportId: string, rtpCapabilities: RtpCapabilities): Promise<VoiceConsumeResultData> {
      this.checkStatus();
      const channelId = this.connectionData?.channelId;

      log("api:voice-signaling", "default", "create consumer", "pid:", producerId, "tid:", transportId, "cid:", channelId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "consume",
         d: { channelId, producerId, rtpCapabilities, transportId, nonce },
      });

      // Wait for the consumer to be created
      return await new Promise<VoiceConsumeResultData>((res, rej) => {
         const unlisten = this.listen("consume_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();

               if ("error" in d) rej(d.error);
               else res(d);
            }
         });
      });
   }

   public async sendResumeConsumer(consumerId: string): Promise<VoiceResumeConsumerResult> {
      this.checkStatus();
      const channelId = this.connectionData.channelId;

      log("api:voice-signaling", "default", "resume consumer", "cid:", consumerId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "resume_consumer",
         d: { channelId, consumerId, nonce },
      });

      return await new Promise<VoiceResumeConsumerResult>((res) => {
         const unlisten = this.listen("resume_consumer_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }

   public async sendCloseConsumer(consumerId: string): Promise<VoiceCloseConsumerResult> {
      this.checkStatus();
      const channelId = this.connectionData.channelId;

      log("api:voice-signaling", "default", "close consumer", "cid:", consumerId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "close_consumer",
         d: { channelId, consumerId, nonce },
      });

      return await new Promise<VoiceCloseConsumerResult>((res) => {
         const unlisten = this.listen("close_consumer_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }

   public async sendRestartIce(transportId: string): Promise<VoiceRestartIceResult> {
      this.checkStatus();
      const channelId = this.connectionData.channelId;

      log("api:voice-signaling", "default", "restart ice", "tid:", transportId);

      const nonce = this.client.generateNonce();
      this.send({
         op: VoiceOperations.DISPATCH,
         t: "restart_ice",
         d: { channelId, transportId, nonce },
      });

      return await new Promise<VoiceRestartIceResult>((res) => {
         const unlisten = this.listen("restart_ice_result", (d) => {
            if (d.nonce === nonce) {
               unlisten();
               res(d);
            }
         });
      });
   }
}
