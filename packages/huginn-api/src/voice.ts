import {
   constants,
   convertToMediaKind,
   error,
   GatewayCode,
   type HMediaKind,
   log,
   type MediasoupAppData,
   type ProducerData,
   type Snowflake,
   type VoiceConsumerCreatedData, type VoiceEvents,
   type VoiceHeartbeat,
   type VoiceHelloData,
   type VoiceIdentify,
   type VoiceNewProducerData,
   VoiceOperations,
   type VoicePayload,
   type VoicePeerLeftData,
   type VoicePing,
   type VoiceProducerClosedData, type VoiceReadyData, type VoiceTransportCreatedData,
   type WebsocketStatus
} from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
import type { Consumer, Producer, ProducerOptions, Transport } from "mediasoup-client/types";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";
import { SharedWebsocket } from "./websocket";

export class Voice extends SharedWebsocket<VoiceEvents> {
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

   private _status: WebsocketStatus = "disconnected";
   public set status(newStatus: WebsocketStatus) {
      this._status = newStatus;
      this.emit("status_changed", newStatus);
   }

   public get status() {
      return this._status;
   }

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      super();

      this.options = { ...defaultClientOptions.voice, ...options };
      this.localVoiceState = { consumersMuted: false, audioMuted: false, audioPaused: false, streaming: false, camera: false };
      this.client = client;
      this.consumers = new Map();
      this.producers = new Map();
      this.listeners = new WeakMap();
   }

   public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
      if (this.status !== "disconnected" && this.status !== "reconnecting") {
         return;
      }

      log("api:voice", "default", "connect", "cid:", channelId, "gid:", guildId)

      this.socket = this.options.createSocket(this.options.url);
      this.connectionInfo = { token, channelId, guildId };
      this.startListening();
   }

   public close(): void {
      log("api:voice", "default", "intentional close")

      // We set this so it won't try to reconnect again. (it will log it but will fail to do so)
      this.connectionInfo = undefined;

      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
   }

   private onOpen(_e: Event) {
      log("api:voice", "default", "connected");

      this.status = "connected";
      this.emit("connected", undefined);
   }

   private onClose(e: CloseEvent) {
      log("api:voice", "default", "closed", "c:", e.code, "r:", e.reason);

      this.status = "disconnected";
      this.stopHeartbeat();
      this.stopPing();
      this.reset();

      this.emit("disconnected", undefined);

      // Completely reset by setting connection info to undefined
      if (e.code === GatewayCode.INTENTIONAL_CLOSE) {
         this.connectionInfo = undefined;
         return;
      }

      this.tryReconnect();
   }

   private tryReconnect() {
      setTimeout(async () => {
         log("api:voice", "default", "try reconnect");

         // If we are able to reconnect
         if (this.connectionInfo) {
            this.status = "reconnecting";

            if (this.client.gateway.status !== "authenticated") {
               await this.client.gateway.waitForEvents(["ready", "resumed"], true);
            }
            await this.client.gateway.connectVoice(this.connectionInfo.guildId, this.connectionInfo.channelId, this.connectionInfo.token)
         }
      }, 2000);
   }

   public async startStreaming(cameraTrack?: MediaStreamTrack, microphoneTrack?: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      log("api:voice", "default", "start streaming");

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

      log("api:voice", "default", "start screensharing");

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

      this.client.gateway.updateVoiceState(this.localVoiceState.audioMuted, this.localVoiceState.consumersMuted, true, this.localVoiceState.camera);
      // this.updateLocalVoiceState({ streaming: true });
   }

   public stopScreensharing(): void {
      if (!this.connectionInfo) {
         return;
      }

      log("api:voice", "default", "stop screensharing");

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
   }

   private async openProducer(kind: HMediaKind, options: ProducerOptions<MediasoupAppData>) {
      if (!this.sendTransport || !options.track) {
         return;
      }

      log("api:voice", "default", "open producer", "mk:", kind);

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

      log("api:voice", "default", "close producer", "id:", producerId);

      const closeProducerData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "close_producer",
         d: { channelId: this.connectionInfo.channelId, producerId: producerId },
      };

      log("api:voice", "send", "close-producer", "id:", producerId);
      this.send(closeProducerData);
   }

   // TODO: Make this the primary function and then it will call smaller functions like muteMicrophone... Currently the reverse of this is happening.
   public updateLocalVoiceState(voiceState: Partial<typeof this.localVoiceState>): void {
      if (voiceState.audioPaused !== undefined) {
         this.localVoiceState.audioPaused = voiceState.audioPaused;

         const producer = this.producers.get("microphone");
         if (voiceState.audioPaused === true && !producer?.paused) {
            producer?.pause();
            this.localVoiceState.audioPaused = true;
         } else if (voiceState.audioPaused === false && !this.localVoiceState?.audioMuted && producer?.paused) {
            producer.resume();
            this.localVoiceState.audioPaused = false;
            // return true;
         }

         log("api:voice", "local-voice-state", "audio paused:", this.localVoiceState.audioPaused);
      }
      if (voiceState.audioMuted !== undefined) {
         this.localVoiceState.audioMuted = voiceState.audioMuted;

         const producer = this.producers.get("microphone");
         if (voiceState.audioMuted === true && !producer?.paused) {
            producer?.pause();
         } else if (voiceState.audioMuted === false && !this.localVoiceState.audioPaused && producer?.paused) {
            producer?.resume();
         }

         log("api:voice", "local-voice-state", "audio muted:", this.localVoiceState.audioMuted);
      }
      if (voiceState.consumersMuted !== undefined) {
         this.localVoiceState.consumersMuted = voiceState.consumersMuted;

         for (const consumer of this.consumers.values()) {
            if (voiceState.consumersMuted === true && !consumer.paused && (consumer.appData.mediaKind === "screen_audio" || consumer.appData.mediaKind === "microphone")) {
               consumer.pause();
            } else if (voiceState.consumersMuted === false && consumer.paused) {
               consumer.resume();
            }
         }

         log("api:voice", "local-voice-state", "consumers muted:", this.localVoiceState.consumersMuted);
      }
      if (voiceState.streaming !== undefined) {
         this.localVoiceState.streaming = voiceState.streaming;

         log("api:voice", "local-voice-state", "streaming:", this.localVoiceState.streaming);
      }
      if (voiceState.camera !== undefined) {
         this.localVoiceState.camera = voiceState.camera;

         log("api:voice", "local-voice-state", "camera:", this.localVoiceState.camera);
      }

      log("api:voice", "local-voice-state", "update", "am:", this.localVoiceState.audioMuted, "ap:", this.localVoiceState.audioPaused, "cm:", this.localVoiceState.consumersMuted, "s:", this.localVoiceState.streaming)
      this.emit("local_voice_state_changed", this.localVoiceState);
   }

   private startListening() {
      log("api:voice", "default", "start listening");

      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private reset() {
      log("api:voice", "default", "reset");
      // this.sequence = undefined;
      // this.socket = undefined;
      this.localVoiceState = { audioPaused: false, audioMuted: false, consumersMuted: false, streaming: false, camera: false };
      this.sequence = undefined;

      this.recvTransport?.close();
      this.sendTransport?.close();

      this.initialProducers = undefined;
      this.consumers = new Map();
      this.producers = new Map();
      this.recvTransport = undefined;
      this.sendTransport = undefined;
      this.device = undefined;
   }

   private async onMessage(e: MessageEvent) {
      const data: VoicePayload = JSON.parse(e.data);

      switch (data.op) {
         case VoiceOperations.HELLO: {
            log("api:voice", "recv", "hello", "intrvl:", data.d.heartbeatInterval);

            await this.handleHello(data.d);
            this.emit("hello", data.d);
            break;
         }
         case VoiceOperations.PONG: {
            this.handlePong();
            break;
         }
         case VoiceOperations.DISPATCH: {
            this.sequence = data.s;

            switch (data.t) {
               case "ready":
                  log("api:voice", "recv", "ready");
                  await this.handleReady(data.d);
                  break;
               case "transport_created":
                  log("api:voice", "recv", "transport created", "id:", data.d.transportId, "dir:", data.d.direction);
                  await this.handleTransportCreated(data.d);
                  break;
               case "transport_connected":
                  log("api:voice", "recv", "transport connected", "id:", data.d.transportId);
                  break;
               case "producer_created":
                  log("api:voice", "recv", "producer created", "id:", data.d.producerId);
                  break;
               case "new_producer":
                  log("api:voice", "recv", "new producer", "id:", data.d.producerId, "uid:", data.d.producerUserId);
                  await this.handleNewProducer(data.d);
                  break;
               case "consumer_created":
                  log("api:voice", "recv", "consumer created", "cid:", data.d.consumerId, "pid:", data.d.producerId, "uid:", data.d.producerUserId);
                  await this.handleConsumerCreated(data.d);
                  break;
               case "consumer_resumed":
                  log("api:voice", "recv", "resumed consumer", "id:", data.d.consumerId);
                  break;
               case "peer_left":
                  log("api:voice", "recv", "peer left", "id:", data.d.sessionId);
                  this.handlePeerLeft(data.d);
                  break;
               case "producer_closed":
                  log("api:voice", "recv", "producer closed", "id:", data.d.producerId);
                  this.handleProducerClosed(data.d);
                  break;
            }

            this.emit(data.t, data.d);
            break;
         }
      }
   }

   /**
       * Waits for all or any of the specified dispatch events to be received.
       * @param events Array of event types to wait for (matches the `t` property).
       * @param waitForAny If true, resolves when any one event is received. Otherwise, waits for all.
       */
   public async waitForDispatch(
      events: (keyof VoiceEvents)[],
      waitForAny?: boolean
   ): Promise<void> {
      if (waitForAny) {
         await Promise.race(events.map(x => new Promise<void>((resolve) => {
            const unlisten = this.listen(x, () => {
               unlisten();
               resolve();
            })
         })))
      }
      else {
         await Promise.allSettled(events.map(x => new Promise<void>((resolve) => {
            const unlisten = this.listen(x, () => {
               unlisten();
               resolve();
            })
         })))
      }
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

      this.emit("local_consumer_created", {
         track: consumer.track,
         consumerId: data.consumerId,
         producerId: data.producerId,
         producerUserId: data.producerUserId,
         kind: data.kind,
      });

      const resumeConsumerData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "resume_consumer",
         d: { channelId: this.connectionInfo.channelId, consumerId: data.consumerId },
      };

      log("api:voice", "send", "resume consumer", data.consumerId);
      this.send(resumeConsumerData);
   }

   private async handleNewProducer(data: VoiceNewProducerData) {
      if (!this.connectionInfo || !this.device || !this.recvTransport) {
         return;
      }

      const consumeData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "consume",
         d: {
            channelId: this.connectionInfo.channelId,
            producerId: data.producerId,
            rtpCapabilities: this.device?.rtpCapabilities,
            transportId: this.recvTransport.id,
         },
      };

      log("api:voice", "send", "consume", "pid:", data.producerId);
      this.send(consumeData);
   }

   private async handleTransportCreated(data: VoiceTransportCreatedData) {
      if (!this.connectionInfo) {
         return;
      }

      try {
         if (data.direction === "send") {
            this.sendTransport = this.device?.createSendTransport(data.params);

            this.sendTransport?.on("connect", async ({ dtlsParameters }, callback, _errback) => {
               const connectTransportData: VoicePayload = {
                  op: VoiceOperations.DISPATCH,
                  t: "connect_transport",
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and sendTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.sendTransport!.id, dtlsParameters },
               };

               log("api:voice", "send", "connect transport", "id:", this.sendTransport?.id, "dir:", "send");
               this.send(connectTransportData);

               callback();
            });

            this.sendTransport?.on("produce", async ({ rtpParameters, appData }, callback, _errback) => {
               if (!this.connectionInfo || !this.sendTransport) {
                  return;
               }

               const produceData: VoicePayload = {
                  op: VoiceOperations.DISPATCH,
                  t: "produce",
                  d: {
                     channelId: this.connectionInfo.channelId,
                     transportId: this.sendTransport.id,
                     kind: (appData as MediasoupAppData).mediaKind,
                     rtpParameters,
                  },
               };

               log("api:voice", "send", "produce", "mk:", appData.mediaKind);
               this.send(produceData);

               const result = await this.waitForEvents(["producer_created"], true);

               callback({ id: result.data.producerId });
            });

            this.emit("send_transport_ready", { channelId: this.connectionInfo.channelId });
         } else if (data.direction === "recv") {
            this.recvTransport = this.device?.createRecvTransport(data.params);

            this.recvTransport?.on("connect", async ({ dtlsParameters }, callback, _errback) => {
               const connectTransportData: VoicePayload = {
                  op: VoiceOperations.DISPATCH,
                  t: "connect_transport",
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and recvTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.recvTransport!.id, dtlsParameters },
               };

               log("api:voice", "send", "connect-transport", "id:", this.recvTransport?.id, "dir:", "recv");
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

      this.status = "authenticated";

      this.device = new mediasoupClient.Device();
      await this.device.load({ routerRtpCapabilities: data.rtpCapabilities });

      const createSendTransportData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "create_transport",
         d: { channelId: this.connectionInfo?.channelId, direction: "send" },
      };

      const createRecvTransportData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "create_transport",
         d: { channelId: this.connectionInfo?.channelId, direction: "recv" },
      };

      log("api:voice", "send", "create send transport");
      this.send(createSendTransportData);

      log("api:voice", "send", "create recv transport");
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

      const identifyData: VoiceIdentify = {
         op: VoiceOperations.IDENTIFY,
         d: {
            token: this.connectionInfo.token,
            channelId: this.connectionInfo.channelId,
            guildId: this.connectionInfo.guildId,
            userId: this.client.user.id as Snowflake,
         },
      };

      log("api:voice", "send", "identify", "cid:", identifyData.d.channelId, "gid:", identifyData.d.guildId);
      this.send(identifyData);
   }

   private handlePong() {
      const rtt = Date.now() - (this.lastPingStart ?? 0);
      this.emit("pong", { rtt });

      log("api:voice", "ping", "pong", "now:", Date.now(), "rtt:", rtt);

      this.pingTimeout = setTimeout(() => {
         this.sendPing();
      }, constants.VOICE_CLIENT_PING_INTERVAL);
   }

   private sendPing() {
      const pingData: VoicePing = { op: VoiceOperations.PING };
      this.lastPingStart = Date.now();

      log("api:voice", "ping", "ping", "start:", this.lastPingStart);
      this.send(pingData);
   }

   private startHeartbeat(interval: number) {
      log("api:voice", "heartbeat", "start heartbeat");

      this.heartbeatInterval = setInterval(() => {
         const data: VoiceHeartbeat = { op: VoiceOperations.HEARTBEAT, d: this.sequence };

         log("api:voice", "heartbeat", "heartbeat", "seq:", this.sequence);
         this.send(data);
      }, interval);
   }

   private stopHeartbeat() {
      log("api:voice", "heartbeat", "stop heartbeat");

      clearInterval(this.heartbeatInterval);
   }

   private stopPing() {
      log("api:voice", "ping", "stop ping");

      clearTimeout(this.pingTimeout);
   }

   public send(data: unknown): void {
      this.socket?.send(JSON.stringify(data));
   }
}
