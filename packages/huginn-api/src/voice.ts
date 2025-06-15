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
   error,
   log,
} from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
import type { Consumer, Producer, ProducerOptions, Transport } from "mediasoup-client/types";
import { EventEmitterWithHistory } from "./event-emitter";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice extends EventEmitterWithHistory<VoiceEvents> {
   public socket?: WebSocket;
   private options: VoiceOptions;
   private client: HuginnClient;
   private heartbeatInterval?: ReturnType<typeof setInterval>;
   private pingTimeout?: ReturnType<typeof setTimeout>;
   private lastPingStart?: number;
   private sequence?: number;

   public localVoiceState: { audioPaused: boolean; audioMuted: boolean; consumersMuted: boolean; streaming: boolean; camera: boolean };
   public connectionInfo?: { token: string; channelId: Snowflake; guildId: Snowflake | null };
   public sendTransport?: Transport<MediasoupAppData>;
   public producers: Map<HMediaKind, Producer<MediasoupAppData>>;
   public consumers: Map<string, Consumer<MediasoupAppData>>;
   private device?: mediasoupClient.Device;
   private initialProducers?: ProducerData[];
   private recvTransport?: Transport;
   private listeners: WeakMap<Producer, (newTrack: MediaStreamTrack | null) => void>;

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      super();

      this.options = { ...defaultClientOptions.voice, ...options };
      this.localVoiceState = { consumersMuted: false, audioMuted: false, audioPaused: true, streaming: false, camera: false };
      this.client = client;
      this.consumers = new Map();
      this.producers = new Map();
      this.listeners = new WeakMap();
   }

   public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
      if (this.socket) {
         return;
      }

      log("api:voice", "api:voice-default", "connect", "cid:", channelId, "gid:", guildId)

      this.socket = this.options.createSocket(this.options.url);
      this.connectionInfo = { token, channelId, guildId };
      this.startListening();
   }

   public close(): void {
      log("api:voice", "api:voice-default", "intentional close")

      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
   }

   public async startStreaming(cameraTrack?: MediaStreamTrack, microphoneTrack?: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      log("api:voice", "api:voice-default", "start streaming");

      if (cameraTrack) {
         await this.openProducer("camera", {
            track: cameraTrack,
            appData: { mediaKind: "camera", userId: this.client.user.id },
         });
      }

      const microphoneProducer = this.producers.get("microphone");
      if (microphoneTrack) {
         if (microphoneProducer) {
            microphoneProducer.replaceTrack({ track: microphoneTrack });
         } else {
            await this.openProducer("microphone", {
               track: microphoneTrack,
               appData: { mediaKind: "microphone", userId: this.client.user.id },
            });
         }
      }
   }

   public async startScreensharing(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      log("api:voice", "api:voice-default", "start screensharing");

      videoTrack.onended = () => {
         this.stopScreensharing();
      };

      const videoProducer = this.producers.get("screen_video");
      const audioProducer = this.producers.get("screen_audio");

      if (videoProducer) {
         await videoProducer.replaceTrack({ track: videoTrack });
         // this.emit("local_producer_created", { kind: "screen_video", producerId: videoProducer.id, track: videoTrack });
      } else {
         await this.openProducer("screen_video", {
            track: videoTrack,
            appData: { mediaKind: "screen_video", userId: this.client.user.id },
            encodings: [{ scalabilityMode: "L1T3" }],
            codecOptions: { videoGoogleStartBitrate: 1000000, videoGoogleMinBitrate: 10000, videoGoogleMaxBitrate: 3000000 },
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

      log("api:voice", "api:voice-default", "stop screensharing");

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
      log("api:voice", "api:voice-media-state", "mute microphone");

      this.updateLocalVoiceState({ audioMuted: true });
      const producer = this.producers.get("microphone");
      if (!producer?.paused) {
         producer?.pause();
      }
   }

   public unmuteMicrophone(): void {
      log("api:voice", "api:voice-media-state", "unmute microphone");

      this.updateLocalVoiceState({ audioMuted: false });
      const producer = this.producers.get("microphone");
      if (!this.localVoiceState.audioPaused && producer?.paused) {
         producer?.resume();
      }
   }

   public pauseMicrophone(): void {
      log("api:voice", "api:voice-media-state", "pause microphone");

      this.updateLocalVoiceState({ audioPaused: true });
      const producer = this.producers.get("microphone");
      if (!producer?.paused) {
         producer?.pause();
      }
   }

   public resumeMicrophone(): boolean {
      log("api:voice", "api:voice-media-state", "resume microphone");

      this.updateLocalVoiceState({ audioPaused: false });

      const producer = this.producers.get("microphone");
      if (!this.localVoiceState?.audioMuted && producer?.paused) {
         producer.resume();
         return true;
      }

      return false;
   }

   public muteConsumers(): void {
      log("api:voice", "api:voice-media-state", "mute consumers");

      for (const consumer of this.consumers.values()) {
         if (!consumer.paused) {
            consumer.pause();
         }
      }

      this.updateLocalVoiceState({ consumersMuted: true });
   }

   public unmuteConsumers(): void {
      log("api:voice", "api:voice-media-state", "unmute consumers");

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

      log("api:voice", "api:voice-default", "open producer", "mk:", kind);

      const producer = await this.sendTransport.produce<MediasoupAppData>(options);

      const listener = (newTrack: MediaStreamTrack | null) => this.emit("local_producer_changed", { kind, producerId: producer.id, track: newTrack });
      producer.on("@replacetrack", listener);
      this.listeners.set(producer, listener);

      this.producers.set(kind, producer);
      this.emit("local_producer_created", { producerId: producer.id, kind: producer.appData.mediaKind, track: options.track });

      return producer;
   }

   private closeProducer(producerId: string) {
      if (!this.connectionInfo) {
         return;
      }

      log("api:voice", "api:voice-default", "close producer", "id:", producerId);

      const closeProducerData: VoicePayload<VoiceOperations.CLOSE_PRODUCER> = {
         op: VoiceOperations.CLOSE_PRODUCER,
         d: { channelId: this.connectionInfo.channelId, producerId: producerId },
      };

      log("api:voice", "api:voice-send", "close-producer", "id:", producerId);
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
      log("api:voice", "api:voice-default", "start listening");

      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private onOpen(_e: Event) {
      log("api:voice", "api:voice-default", "connected");

      this.emit("connected", undefined);
   }

   private onClose(e: CloseEvent) {
      log("api:voice", "api:voice-default", "closed", "c:", e.code, "r:", e.reason);

      this.stopHeartbeat();
      this.stopPing();
      this.reset();

      this.emit("disconnected", undefined);
   }

   private reset() {
      log("api:voice", "api:voice-default", "reset");

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
            const hello = data.d as VoiceHelloData;
            await this.handleHello(hello);
            log("api:voice", "api:voice-recv", "hello", "intrvl:", hello.heartbeatInterval);
            break;
         }
         case VoiceOperations.READY: {
            const ready = data.d as VoiceReadyData
            await this.handleReady(data.d as VoiceReadyData);
            log("api:voice", "api:voice-recv", "ready");
            break;
         }
         case VoiceOperations.TRANSPORT_CREATED: {
            const created = data.d as VoiceTransportCreatedData
            await this.handleTransportCreated(created);
            log("api:voice", "api:voice-recv", "transport created", "id:", created.transportId, "dir:", created.direction);
            break;
         }
         case VoiceOperations.TRANSPORT_CONNECTED: {
            const connected = data.d as VoiceTransportConnectedData;
            log("api:voice", "api:voice-recv", "transport connected", "id:", connected.transportId);
            break;
         }
         case VoiceOperations.PRODUCER_CREATED: {
            const created = data.d as VoiceProducerCreatedData;
            log("api:voice", "api:voice-recv", "producer created", "id:", created.producerId);
            break;
         }
         case VoiceOperations.NEW_PRODUCER: {
            const producer = data.d as VoiceNewProducerData;
            await this.handleNewProducer(producer);
            log("api:voice", "api:voice-recv", "new producer", "id:", producer.producerId, "uid:", producer.producerUserId);
            break;
         }
         case VoiceOperations.CONSUMER_CREATED: {
            const created = data.d as VoiceConsumerCreatedData;
            await this.handleConsumerCreated(created);
            log("api:voice", "api:voice-recv", "consumer created", "cid:", created.consumerId, "pid:", created.producerId, "uid:", created.producerUserId);
            break;
         }
         case VoiceOperations.CONSUMER_RESUMED: {
            const resumed = data.d as VoiceConsumerResumedData;
            log("api:voice", "api:voice-recv", "resumed consumer", "id:", resumed.consumerId);
            break;
         }
         case VoiceOperations.PEER_LEFT: {
            const left = data.d as VoicePeerLeftData;
            this.handlePeerLeft(left);
            log("api:voice", "api:voice-recv", "peer left", "id:", left.peerId);
            break;
         }
         case VoiceOperations.PONG: {
            this.handlePong();
            break;
         }
         case VoiceOperations.PRODUCER_CLOSED: {
            const closed = data.d as VoiceProducerClosedData;
            this.handleProducerClosed(closed);
            log("api:voice", "api:voice-recv", "producer closed", "id:", closed.producerId);
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

      log("api:voice", "api:voice-send", "resume consumer", data.consumerId);
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

      log("api:voice", "api:voice-send", "consume", "pid:", data.producerId);
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

               log("api:voice", "api:voice-send", "connect transport", "id:", this.sendTransport?.id, "dir:", "send");
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

               log("api:voice", "api:voice-send", "produce", "mk:", appData.mediaKind);
               this.send(produceData);

               const { producerId } = await this.waitForProducerCreated();

               callback({ id: producerId });
            });

            this.emit("send_transport_ready", { channelId: this.connectionInfo.channelId });
         } else if (data.direction === "recv") {
            this.recvTransport = this.device?.createRecvTransport(data.params);

            this.recvTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
               const connectTransportData: VoicePayload<VoiceOperations.CONNECT_TRANSPORT> = {
                  op: VoiceOperations.CONNECT_TRANSPORT,
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and recvTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.recvTransport!.id, dtlsParameters },
               };

               log("api:voice", "api:voice-send", "connect-transport", "id:", this.recvTransport?.id, "dir:", "recv");
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
         error("api:voice", "Failed to setup transport", e);
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
         const listener = this.listeners.get(producer[1]);
         if (listener) {
            producer[1].off("@replacetrack", listener);
         }

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

      log("api:voice", "api:voice-send", "create send transport");
      this.send(createSendTransportData);

      log("api:voice", "api:voice-send", "create recv transport");
      this.send(createRecvTransportData);

      this.sendPing();

      this.initialProducers = data.producers;
   }

   private async handleHello(data: VoiceHelloData) {
      this.startHeartbeat(data.heartbeatInterval);

      if (!this.client.user || !this.connectionInfo) {
         error("api:voice", "Client user or connection info was null when identifying voice websocket")
         return;
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

      log("api:voice", "api:voice-send", "identify", "cid:", identifyData.d.channelId, "gid:", identifyData.d.guildId);
      this.send(identifyData);
   }

   private handlePong() {
      const rtt = Date.now() - (this.lastPingStart ?? 0);
      this.emit("ping", { rtt });

      log("api:voice", "api:voice-ping", "pong", "now:", Date.now(), "rtt:", rtt);

      this.pingTimeout = setTimeout(() => {
         this.sendPing();
      }, constants.VOICE_CLIENT_PING_INTERVAL);
   }

   private sendPing() {
      const pingData: VoicePayload<VoiceOperations.PING> = { op: VoiceOperations.PING, d: undefined };
      this.lastPingStart = Date.now();

      log("api:voice", "api:voice-ping", "ping", "start:", this.lastPingStart);
      this.send(pingData);
   }

   private startHeartbeat(interval: number) {
      log("api:voice", "api:voice-heartbeat", "start heartbeat");

      this.heartbeatInterval = setInterval(() => {
         const data: VoicePayload<VoiceOperations.HEARTBEAT> = { op: VoiceOperations.HEARTBEAT, d: this.sequence };

         log("api:voice", "api:voice-heartbeat", "heartbeat", "seq:", this.sequence);
         this.send(data);
      }, interval);
   }

   private stopHeartbeat() {
      log("api:voice", "api:voice-heartbeat", "stop heartbeat");
      clearInterval(this.heartbeatInterval);
   }

   private stopPing() {
      log("api:voice", "api:voice-ping", "stop ping");
      clearTimeout(this.pingTimeout);
   }

   public send(data: unknown): void {
      this.socket?.send(JSON.stringify(data));
   }
}
