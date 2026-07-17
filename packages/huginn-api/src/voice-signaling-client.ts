import type { DtlsParameters, RtpCapabilities, RtpParameters } from "mediasoup-client/types";

import {
   analytics,
   CONSTANTS,
   GatewayCode,
   recordSpanError,
   VoiceOperations,
   type HMediaKind,
   type Snowflake,
   type VoiceCloseConsumerResult,
   type VoiceCloseProducerResult,
   type VoiceConnectTransportResult,
   type VoiceConsumeResult,
   type VoiceCreateTransportResult,
   type VoiceHelloData,
   type VoicePauseConsumerResult,
   type VoicePayload,
   type VoiceProduceResult,
   type VoiceReadyData,
   type VoiceRestartIceResult,
   type VoiceResumeConsumerResult,
   type VoiceWebsocketEvents,
} from "@huginn/shared";

import type { HuginnClient, VoiceConnectionData, VoiceOptions, VoiceSignallingResetType } from ".";

import { SharedWebsocket } from "./websocket";

type SignalingClientStatus = "connecting" | "connected" | "helloed" | "authenticated" | "resuming" | "disconnected" | "idle";

type Events = {
   connected: undefined;
   disconnected: undefined;
   status_changed: SignalingClientStatus;

   pong: { rtt: number };

   reset: { type: VoiceSignallingResetType };
} & VoiceWebsocketEvents;

export class VoiceSignalingClient extends SharedWebsocket<Events> {
   private client: HuginnClient;
   private options: VoiceOptions;
   public socket?: WebSocket;
   public connectionData?: VoiceConnectionData;
   private intentionalClose = false;

   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private reconnectTimeout?: ReturnType<typeof setTimeout>;
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

   private getDefaultAttributes(): Record<string, string | number | boolean> {
      return {
         "voice.user.id": this.client.currentUser?.id ?? "null",
         "voice.signaling.status": this.status,
         "voice.signaling.url": this.options.url,
         "voice.signaling.can_resume": this.canResume,
         "voice.signaling.session_id": this.sessionId ?? "null",
         "voice.signaling.sequence": this.sequence ?? "null",
         "voice.signaling.channel_id": this.connectionData?.channelId ?? "null",
         "voice.signaling.guild_id": this.connectionData?.guildId ?? "null",
      };
   }

   // ============================================================
   // Public API - Connection Management
   // ============================================================

   public async connect(token: string, channelId: Snowflake, guildId: Snowflake | null): Promise<boolean> {
      return await analytics.startActiveSpan("apiVoiceSignaling.connect", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.channel_id": channelId,
            "params.guild_id": guildId ?? "null",
            "params.has_token": !!token,
         });

         try {
            if (this.status !== "idle" && this.status !== "disconnected") {
               throw new Error("Voice signaling socket is already connected or is connecting");
            }

            this.intentionalClose = false;
            this.connectionData = { token, channelId, guildId };
            this.setStatus("connecting");
            this.socket = this.options.createSocket(this.options.url);

            this.socket.onopen = () => this.onOpen();
            this.socket.onclose = (e) => this.onClose(e);
            this.socket.onmessage = (e) => this.onMessage(e);

            const result = await this.waitForAnyEvents(["hello", "disconnected"]);

            if (result.event === "disconnected") return false;
            return true;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public close(): void {
      analytics.startActiveSpan("apiVoiceSignaling.close", (span) => {
         span.setAttributes(this.getDefaultAttributes());

         this.intentionalClose = true;
         this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
         this.hardReset();
      });
   }

   // ============================================================
   // Private - Connection Lifecycle
   // ============================================================

   private onOpen(): void {
      analytics.startActiveSpan("apiVoiceSignaling.onOpen", (span) => {
         span.setAttributes(this.getDefaultAttributes());

         this.setStatus("connected");
         this.emit("connected", undefined);
      });
   }

   private onClose(e: CloseEvent): void {
      analytics.startActiveSpan("apiVoiceSignaling.onClose", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "event.close.code": e.code,
            "event.close.reason": e.reason,
            "voice.signaling.intentional_close": this.intentionalClose,
         });
         analytics.log({
            body: "Voice signaling closed",
            level: "info",
            attributes: {
               ...this.getDefaultAttributes(),
               "event.close.code": e.code,
               "event.close.reason": e.reason,
               "voice.signaling.intentional_close": this.intentionalClose,
            },
         });

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

            analytics.withRootContext(() => {
               this.scheduleReconnect();
            });
         }
      });
   }

   // ============================================================
   // Private - Reconnection
   // ============================================================

   private scheduleReconnect(): void {
      this.clearReconnectTimeout();

      this.reconnectTimeout = setTimeout(async () => {
         await this.attemptReconnect();
      }, 2000);
   }

   private async attemptReconnect() {
      return await analytics.startActiveSpan("apiVoiceSignaling.attemptReconnect", async (span) => {
         span.setAttributes(this.getDefaultAttributes());

         try {
            if (!this.connectionData) throw new Error("Connection Data cannot be undefined when reconnecting voice");

            this.connect(this.connectionData.token, this.connectionData.channelId, this.connectionData.guildId);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private clearReconnectTimeout(): void {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
   }

   // ============================================================
   // Private - Message Processing
   // ============================================================

   private async onMessage(e: MessageEvent): Promise<void> {
      const data: VoicePayload = JSON.parse(e.data);

      switch (data.op) {
         case VoiceOperations.HELLO:
            this.handleHello(data.d);
            break;
         case VoiceOperations.DISPATCH:
            this.sequence = data.s;

            switch (data.t) {
               case "ready":
                  await this.handleReady(data.d);
                  break;
               case "resumed":
                  await this.handleResumed();
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
               case "pause_consumer_result":
                  this.emit("pause_consumer_result", data.d);
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
            this.handlePong();
            break;
      }
   }

   private handleHello(data: VoiceHelloData) {
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

      this.emit("hello", data);
   }

   private async handleReady(data: VoiceReadyData) {
      this.setStatus("authenticated");
      this.sendPing();
      this.emit("ready", data);
   }

   private async handleResumed() {
      this.setStatus("authenticated");
      this.sendPing();
   }

   private handlePong() {
      const rtt = Date.now() - (this.lastPingStart ?? 0);

      this.pingTimeout = setTimeout(() => {
         this.sendPing();
      }, CONSTANTS.VOICE_CLIENT_PING_INTERVAL);

      this.emit("pong", { rtt });
   }

   // ============================================================
   // Private - Heartbeat
   // ============================================================

   private startHeartbeatInterval(interval: number) {
      this.heartbeatInterval = setInterval(() => {
         this.send({ op: VoiceOperations.HEARTBEAT, d: this.sequence });
      }, interval);
   }

   private stopHeartbeatInterval() {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
   }

   private setStatus(newStatus: SignalingClientStatus) {
      this._status = newStatus;
      this.emit("status_changed", newStatus);
   }

   private send(data: VoicePayload): void {
      this.socket?.send(JSON.stringify(data));
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
      this.stopHeartbeatInterval();
      clearInterval(this.pingTimeout);

      if (emitEvent) this.emit("reset", { type: "soft" });
   }

   public hardReset(): void {
      this.softReset(false);
      this.resetSession(false);
      this.connectionData = undefined;
      this.clearReconnectTimeout();
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
      return await analytics.startActiveSpan("apiVoiceSignaling.sendCreateTransport", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.direction": direction,
         });

         try {
            this.checkStatus();

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "create_transport",
               d: { channelId: this.connectionData.channelId, direction, nonce },
            });

            return await this.waitForCommandResult("create_transport_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendConnectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<VoiceConnectTransportResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendConnectTransport", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.transport_id": transportId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData?.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "connect_transport",
               d: { channelId, transportId, dtlsParameters, nonce },
            });

            return await this.waitForCommandResult("connect_transport_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendCreateProducer(kind: HMediaKind, transportId: string, rtpParameters: RtpParameters): Promise<VoiceProduceResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendCreateProducer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.kind": kind,
            "params.transport_id": transportId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData?.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "produce",
               d: { channelId, transportId, kind, rtpParameters, nonce },
            });

            return await this.waitForCommandResult("produce_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendCloseProducer(producerId: string): Promise<VoiceCloseProducerResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendCloseProducer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.producer_id": producerId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData?.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "close_producer",
               d: { producerId, channelId, nonce },
            });

            return await this.waitForCommandResult("close_producer_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendCreateConsumer(producerId: string, transportId: string, rtpCapabilities: RtpCapabilities): Promise<VoiceConsumeResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendCreateConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.producer_id": producerId,
            "params.transport_id": transportId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData?.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "consume",
               d: { channelId, producerId, rtpCapabilities, transportId, nonce },
            });

            return await this.waitForCommandResult("consume_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendResumeConsumer(consumerId: string): Promise<VoiceResumeConsumerResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendResumeConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer_id": consumerId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "resume_consumer",
               d: { channelId, consumerId, nonce },
            });

            return await this.waitForCommandResult("resume_consumer_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendPauseConsumer(consumerId: string): Promise<VoicePauseConsumerResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendPauseConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer_id": consumerId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "pause_consumer",
               d: { channelId, consumerId, nonce },
            });

            return await this.waitForCommandResult("pause_consumer_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendCloseConsumer(consumerId: string): Promise<VoiceCloseConsumerResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendCloseConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer_id": consumerId,
         });

         try {
            this.checkStatus();
            const channelId = this.connectionData.channelId;

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "close_consumer",
               d: { channelId, consumerId, nonce },
            });

            return await this.waitForCommandResult("close_consumer_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async sendRestartIce(transportId: string): Promise<VoiceRestartIceResult> {
      return await analytics.startActiveSpan("apiVoiceSignaling.sendRestartIce", async (span) => {
         try {
            this.checkStatus();
            const channelId = this.connectionData.channelId;
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.transport_id": transportId,
            });

            const nonce = this.client.generateNonce();
            this.send({
               op: VoiceOperations.DISPATCH,
               t: "restart_ice",
               d: { channelId, transportId, nonce },
            });

            return await this.waitForCommandResult("restart_ice_result", nonce);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private async waitForCommandResult<K extends keyof VoiceWebsocketEvents>(resultEvent: K, nonce: string): Promise<VoiceWebsocketEvents[K]> {
      const result = await this.waitForAnyEventUntil([resultEvent, "disconnected", "reset"], (event, data) => {
         if (event === "disconnected" || event === "reset") return true;

         return event === resultEvent && (data as any)?.nonce === nonce;
      });

      if (result.event === "disconnected" || result.event === "reset") {
         throw new Error(`Voice signaling closed while waiting for ${resultEvent}`);
      }

      return result.data as VoiceWebsocketEvents[K];
   }
}
