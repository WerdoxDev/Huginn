import {
   constants,
   GatewayCode,
   type HMediaKind,
   type MediasoupAppData,
   type ProducerData,
   type Snowflake,
   type VoiceConsumerCreatedData,
   type VoiceConsumerResumedData,
   type VoiceEvents,
   type VoiceHelloData,
   type VoiceNewProducerData,
   VoiceOperations,
   type VoicePayload,
   type VoicePeerLeftData,
   type VoiceProducerClosedData,
   type VoiceProducerCreatedData,
   type VoiceReadyData,
   type VoiceTransportConnectedData,
   type VoiceTransportCreatedData,
   convertToMediaKind,
} from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
import type { Consumer, Producer, ProducerOptions, Transport } from "mediasoup-client/types";
import { EventEmitterWithHistory } from "./event-emitter";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice {
   public socket?: WebSocket;
   private options: VoiceOptions;
   private client: HuginnClient;
   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private lastPingStart?: number;
   private sequence?: number;
   private readonly emitter = new EventEmitterWithHistory();

   public localVoiceState: { audioPaused: boolean; audioMuted: boolean; consumersMuted: boolean; streaming: boolean; camera: boolean };
   public connectionInfo?: { token: string; channelId: Snowflake; guildId: Snowflake | null };
   public sendTransport?: Transport<MediasoupAppData>;
   public producers: Map<HMediaKind, Producer<MediasoupAppData>>;
   public consumers: Map<string, Consumer<MediasoupAppData>>;
   private device?: mediasoupClient.Device;
   private initialProducers?: ProducerData[];
   private recvTransport?: Transport;

   public on<EventName extends keyof VoiceEvents>(
      eventName: EventName,
      handler: (eventArg: VoiceEvents[EventName]) => void,
      withoutHistory?: boolean,
   ): void {
      this.emitter.on(eventName, handler, withoutHistory);
   }

   public off<EventName extends keyof VoiceEvents>(eventName: EventName, handler: (eventArg: VoiceEvents[EventName]) => void): void {
      this.emitter.off(eventName, handler);
   }

   public listen<EventName extends keyof VoiceEvents>(
      eventName: EventName,
      handler: (eventArg: VoiceEvents[EventName]) => void,
      withoutHistory?: boolean,
   ): () => void {
      this.on(eventName, handler, withoutHistory);
      return () => this.off(eventName, handler);
   }

   private emit<EventName extends keyof VoiceEvents>(eventName: EventName, eventArg: VoiceEvents[EventName]): void {
      this.emitter.emit(eventName, eventArg);
   }

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      this.options = { ...defaultClientOptions.voice, ...options };
      this.localVoiceState = { consumersMuted: false, audioMuted: false, audioPaused: true, streaming: false, camera: false };
      this.client = client;
      this.consumers = new Map();
      this.producers = new Map();
   }

   public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
      if (this.socket) {
         return;
      }

      this.socket = this.options.createSocket(this.options.url);
      this.connectionInfo = { token, channelId, guildId };
      this.startListening();
   }

   public close(): void {
      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
      this.reset();
   }

   public async startStreaming(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      if (videoTrack) {
         await this.openProducer("camera", {
            track: videoTrack,
            appData: { mediaKind: "camera", userId: this.client.user.id },
         });
      }

      const microphoneProducer = this.producers.get("microphone");
      if (audioTrack) {
         if (microphoneProducer) {
            microphoneProducer.replaceTrack({ track: audioTrack });
         } else {
            await this.openProducer("microphone", {
               track: audioTrack,
               appData: { mediaKind: "microphone", userId: this.client.user.id },
            });
         }
      }
   }

   public async startScreensharing(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      videoTrack.onended = () => {
         this.stopScreensharing();
      };

      const videoProducer = this.producers.get("screen_video");
      const audioProducer = this.producers.get("screen_audio");

      if (videoProducer) {
         await videoProducer.replaceTrack({ track: videoTrack });
         this.emit("local_producer_created", { kind: "screen_video", producerId: videoProducer.id, track: videoTrack });
      } else {
         await this.openProducer("screen_video", {
            track: videoTrack,
            appData: { mediaKind: "screen_video", userId: this.client.user.id },
            encodings: [{ scalabilityMode: "L1T3" }],
            codecOptions: { videoGoogleStartBitrate: 1000 },
         });
      }

      if (audioTrack) {
         if (audioProducer) {
            await audioProducer.replaceTrack({ track: audioTrack });
         } else {
            await this.openProducer("screen_audio", { track: audioTrack, appData: { mediaKind: "screen_audio", userId: this.client.user.id } });
         }
      }

      if (audioProducer && !audioTrack) {
         this.closeProducer(audioProducer.id);
      }

      this.updateLocalVoiceState({ streaming: true });
   }

   public stopScreensharing(): void {
      if (!this.connectionInfo) {
         return;
      }
      const videoProducer = this.producers.get("screen_video");
      const audioProducer = this.producers.get("screen_audio");

      // Screenshare must have a video. Audio is optional
      if (!videoProducer) {
         return;
      }

      this.closeProducer(videoProducer.id);

      if (audioProducer) {
         this.closeProducer(audioProducer.id);
      }

      this.client.gateway.updateVoiceState(this.localVoiceState.audioMuted, this.localVoiceState.consumersMuted, false, this.localVoiceState.camera);

      this.updateLocalVoiceState({ streaming: false });
   }

   public muteMicrophone(): void {
      this.updateLocalVoiceState({ audioMuted: true });
      const producer = this.producers.get("microphone");
      if (!producer?.paused) {
         producer?.pause();
      }
   }

   public unmuteMicrophone(): void {
      this.updateLocalVoiceState({ audioMuted: false });
      const producer = this.producers.get("microphone");
      if (!this.localVoiceState.audioPaused && producer?.paused) {
         producer?.resume();
      }
   }

   public pauseMicrophone(): void {
      this.updateLocalVoiceState({ audioPaused: true });
      const producer = this.producers.get("microphone");
      if (!producer?.paused) {
         producer?.pause();
      }
   }

   public resumeMedia(): boolean {
      this.updateLocalVoiceState({ audioPaused: false });

      const producer = this.producers.get("microphone");
      if (!this.localVoiceState?.audioMuted && producer?.paused) {
         producer.resume();
         return true;
      }

      return false;
   }

   public muteConsumers(): void {
      for (const consumer of this.consumers.values()) {
         if (!consumer.paused) {
            consumer.pause();
         }
      }

      this.updateLocalVoiceState({ consumersMuted: true });
   }

   public unmuteConsumers(): void {
      for (const consumer of this.consumers.values()) {
         if (consumer.paused) {
            consumer.resume();
         }
      }

      this.updateLocalVoiceState({ consumersMuted: false });
   }

   private async openProducer(kind: HMediaKind, options: ProducerOptions<MediasoupAppData>) {
      if (!this.sendTransport || !options.track) {
         return;
      }

      const producer = await this.sendTransport.produce<MediasoupAppData>(options);
      this.producers.set(kind, producer);
      this.emit("local_producer_created", { producerId: producer.id, kind: producer.appData.mediaKind, track: options.track });
   }

   private closeProducer(producerId: string) {
      if (!this.connectionInfo) {
         return;
      }

      const closeProducerData: VoicePayload<VoiceOperations.CLOSE_PRODUCER> = {
         op: VoiceOperations.CLOSE_PRODUCER,
         d: { channelId: this.connectionInfo.channelId, producerId: producerId },
      };

      this.send(closeProducerData);
   }

   private updateLocalVoiceState(voiceState: Partial<typeof this.localVoiceState>) {
      if (voiceState.audioPaused !== undefined) {
         this.localVoiceState.audioPaused = voiceState.audioPaused;
      }
      if (voiceState.audioMuted !== undefined) {
         this.localVoiceState.audioMuted = voiceState.audioMuted;
      }
      if (voiceState.consumersMuted !== undefined) {
         this.localVoiceState.consumersMuted = voiceState.consumersMuted;
      }
      if (voiceState.streaming !== undefined) {
         this.localVoiceState.streaming = voiceState.streaming;
      }
      if (voiceState.camera !== undefined) {
         this.localVoiceState.camera = voiceState.camera;
      }
      this.emit("local_voice_state_changed", this.localVoiceState);
   }

   private startListening() {
      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private onOpen(_e: Event) {
      if (this.options.log) {
         console.log("[Voice] Connected");
      }

      this.emit("connected", undefined);
   }

   private onClose(e: CloseEvent) {
      if (this.options.log) {
         console.log("[Voice] Closed", e.code, e.reason);
      }

      this.stopHeartbeat();
      this.reset();

      this.emit("disconnected", undefined);
   }

   private reset() {
      this.sequence = undefined;
      this.socket = undefined;
      this.consumers = new Map();
      this.producers = new Map();
      this.connectionInfo = undefined;
      this.recvTransport = undefined;
      this.sendTransport = undefined;
      this.initialProducers = undefined;
      this.device = undefined;
      this.localVoiceState = { audioPaused: true, audioMuted: false, consumersMuted: false, streaming: false, camera: false };
   }

   private async onMessage(e: MessageEvent) {
      const data: VoicePayload = JSON.parse(e.data);

      switch (data.op) {
         case VoiceOperations.HELLO: {
            await this.handleHello(data.d as VoiceHelloData);
            break;
         }
         case VoiceOperations.READY: {
            await this.handleReady(data.d as VoiceReadyData);
            break;
         }
         case VoiceOperations.TRANSPORT_CREATED: {
            await this.handleTransportCreated(data.d as VoiceTransportCreatedData);
            break;
         }
         case VoiceOperations.TRANSPORT_CONNECTED: {
            const connected = data.d as VoiceTransportConnectedData;
            console.log(`[Voice] Transport connected ${connected.transportId}}`);
            break;
         }
         case VoiceOperations.PRODUCER_CREATED: {
            const created = data.d as VoiceProducerCreatedData;
            console.log(`[Voice] Producer created ${created.producerId}`);
            break;
         }
         case VoiceOperations.NEW_PRODUCER: {
            await this.handleNewProducer(data.d as VoiceNewProducerData);
            break;
         }
         case VoiceOperations.CONSUMER_CREATED: {
            await this.handleConsumerCreated(data.d as VoiceConsumerCreatedData);
            break;
         }
         case VoiceOperations.CONSUMER_RESUMED: {
            const resumed = data.d as VoiceConsumerResumedData;
            console.log(`[Voice] Resumed consumer ${resumed.consumerId}`);
            break;
         }
         case VoiceOperations.PEER_LEFT: {
            this.handlePeerLeft(data.d as VoicePeerLeftData);
            break;
         }
         case VoiceOperations.PONG: {
            this.handlePong();
            break;
         }
         case VoiceOperations.PRODUCER_CLOSED: {
            this.handleProducerClosed(data.d as VoiceProducerClosedData);
            break;
         }
      }
   }

   private async waitForProducerCreated() {
      return await new Promise<VoiceProducerCreatedData>((res) => {
         const onMessage = (e: MessageEvent) => {
            const data: VoicePayload = JSON.parse(e.data);

            if (data.op === VoiceOperations.PRODUCER_CREATED) {
               this.socket?.removeEventListener("message", onMessage);
               res(data.d as VoiceProducerCreatedData);
            }
         };

         this.socket?.addEventListener("message", onMessage.bind(this));
      });
   }

   private handlePeerLeft(data: VoicePeerLeftData) {
      for (const producerId of data.producerIds) {
         const consumer = Array.from(this.consumers.values()).find((c) => c.producerId === producerId);
         if (consumer) {
            consumer.close();
            this.consumers.delete(consumer.id);
            this.emit("producer_closed", { producerId, userId: data.userId });
         }
      }
   }

   private async handleConsumerCreated(data: VoiceConsumerCreatedData) {
      if (!this.recvTransport || !this.connectionInfo) {
         return;
      }

      const consumer = await this.recvTransport.consume<MediasoupAppData>({
         id: data.consumerId,
         producerId: data.producerId,
         rtpParameters: data.rtpParameters,
         kind: convertToMediaKind(data.kind),
         appData: { mediaKind: data.kind, userId: data.producerUserId },
      });

      this.consumers.set(consumer.id, consumer);

      this.emit("consumer_created", {
         track: consumer.track,
         consumerId: data.consumerId,
         producerId: data.producerId,
         producerUserId: data.producerUserId,
         kind: data.kind,
      });

      const resumeConsumerData: VoicePayload<VoiceOperations.RESUME_CONSUMER> = {
         op: VoiceOperations.RESUME_CONSUMER,
         d: { channelId: this.connectionInfo.channelId, consumerId: data.consumerId },
      };

      this.send(resumeConsumerData);
   }

   private async handleNewProducer(data: VoiceNewProducerData) {
      if (!this.connectionInfo || !this.device || !this.recvTransport) {
         return;
      }

      const consumeData: VoicePayload<VoiceOperations.CONSUME> = {
         op: VoiceOperations.CONSUME,
         d: {
            channelId: this.connectionInfo.channelId,
            producerId: data.producerId,
            rtpCapabilities: this.device?.rtpCapabilities,
            transportId: this.recvTransport.id,
         },
      };

      this.send(consumeData);
   }

   private async handleTransportCreated(data: VoiceTransportCreatedData) {
      if (!this.connectionInfo) {
         return;
      }

      try {
         if (data.direction === "send") {
            this.sendTransport = this.device?.createSendTransport(data.params);

            this.sendTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
               const connectTransportData: VoicePayload<VoiceOperations.CONNECT_TRANSPORT> = {
                  op: VoiceOperations.CONNECT_TRANSPORT,
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and sendTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.sendTransport!.id, dtlsParameters },
               };

               this.send(connectTransportData);
               callback();
            });

            this.sendTransport?.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
               if (!this.connectionInfo || !this.sendTransport) {
                  return;
               }

               const produceData: VoicePayload<VoiceOperations.PRODUCE> = {
                  op: VoiceOperations.PRODUCE,
                  d: {
                     channelId: this.connectionInfo.channelId,
                     transportId: this.sendTransport.id,
                     kind: (appData as MediasoupAppData).mediaKind,
                     rtpParameters,
                  },
               };

               this.send(produceData);

               const { producerId } = await this.waitForProducerCreated();

               callback({ id: producerId });
            });

            this.emit("transport_ready", { channelId: this.connectionInfo.channelId });
         } else if (data.direction === "recv") {
            this.recvTransport = this.device?.createRecvTransport(data.params);

            this.recvTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
               const connectTransportData: VoicePayload<VoiceOperations.CONNECT_TRANSPORT> = {
                  op: VoiceOperations.CONNECT_TRANSPORT,
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and recvTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.recvTransport!.id, dtlsParameters },
               };

               this.send(connectTransportData);
               callback();
            });

            if (this.initialProducers) {
               for (const producer of this.initialProducers) {
                  await this.handleNewProducer(producer);
               }
            }
         }
      } catch (e) {
         console.error("Failed to setup transport:", e);
      }
   }

   private handleProducerClosed(data: VoiceProducerClosedData) {
      const consumer = Array.from(this.consumers.values()).find((c) => c.producerId === data.producerId);
      if (consumer) {
         consumer.close();
         this.consumers.delete(consumer.id);
      }

      const producer = Array.from(this.producers.entries()).find(([_, x]) => x.id === data.producerId);
      if (producer) {
         producer[1].close();
         this.producers.delete(producer[0]);
      }

      this.emit("producer_closed", { producerId: data.producerId, userId: data.userId });
   }

   private async handleReady(data: VoiceReadyData) {
      if (!this.connectionInfo) {
         return;
      }

      this.device = new mediasoupClient.Device();
      await this.device.load({ routerRtpCapabilities: data.rtpCapabilities });

      const createSendTransportData: VoicePayload<VoiceOperations.CREATE_TRANSPORT> = {
         op: VoiceOperations.CREATE_TRANSPORT,
         d: { channelId: this.connectionInfo?.channelId, direction: "send" },
      };

      const createRecvTransportData: VoicePayload<VoiceOperations.CREATE_TRANSPORT> = {
         op: VoiceOperations.CREATE_TRANSPORT,
         d: { channelId: this.connectionInfo?.channelId, direction: "recv" },
      };

      this.send(createSendTransportData);
      this.send(createRecvTransportData);
      this.sendPing();

      this.initialProducers = data.producers;
   }

   private async handleHello(data: VoiceHelloData) {
      this.startHeartbeat(data.heartbeatInterval);

      if (!this.client.user || !this.connectionInfo) {
         throw new Error("Client user or connection info was null when identifying voice websocket");
      }

      const identifyData: VoicePayload<VoiceOperations.IDENTIFY> = {
         op: VoiceOperations.IDENTIFY,
         d: {
            token: this.connectionInfo.token,
            channelId: this.connectionInfo.channelId,
            guildId: this.connectionInfo.guildId,
            userId: this.client.user.id as Snowflake,
         },
      };

      this.send(identifyData);
   }

   private handlePong() {
      const rtt = Date.now() - (this.lastPingStart ?? 0);
      this.emit("ping", { rtt });

      setTimeout(() => {
         this.sendPing();
      }, constants.VOICE_CLIENT_PING_INTERVAL);
   }

   private sendPing() {
      const pingData: VoicePayload<VoiceOperations.PING> = { op: VoiceOperations.PING, d: undefined };
      this.lastPingStart = Date.now();
      this.send(pingData);
   }

   private startHeartbeat(interval: number) {
      this.heartbeatInterval = setInterval(() => {
         const data: VoicePayload<VoiceOperations.HEARTBEAT> = { op: VoiceOperations.HEARTBEAT, d: this.sequence };
         if (this.options.log) {
            console.log("[Voice] Sending Heartbeat");
         }
         this.send(data);
      }, interval);
   }

   private stopHeartbeat() {
      clearInterval(this.heartbeatInterval);
   }

   public send(data: unknown): void {
      this.socket?.send(JSON.stringify(data));
   }
}
