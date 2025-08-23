import {
   constants,
   convertToMediaKind,
   error,
   GatewayCode,
   type HMediaKind,
   type LocalVoiceState,
   log,
   type MediasoupAppData,
   type ProducerData,
   type Snowflake,
   type VoiceConsumerClosedData,
   type VoiceConsumerCreatedData,
   type VoiceEvents,
   type VoiceHeartbeat,
   type VoiceHelloData,
   type VoiceIdentify,
   VoiceOperations,
   type VoicePayload,
   type VoicePing,
   type VoiceProducerClosedData,
   type VoiceProducerCreatedData,
   type VoiceReadyData,
   type VoiceStatus,
   type VoiceTransportCreatedData,
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

   public localVoiceState: LocalVoiceState;
   public connectionInfo?: { token: string; channelId: Snowflake; guildId: Snowflake | null };
   public sendTransport?: Transport<MediasoupAppData>;
   public recvTransport?: Transport;
   public producers: Map<HMediaKind, Producer<MediasoupAppData>>;
   public consumers: Map<string, Consumer<MediasoupAppData>>;
   private device?: mediasoupClient.Device;
   private initialProducers?: ProducerData[];
   private listeners: WeakMap<Producer, (newTrack: MediaStreamTrack | null) => void>;

   private _status: VoiceStatus = "none";
   private set status(newStatus: VoiceStatus) {
      this._status = newStatus;
      this.emit("status_changed", newStatus);
   }

   public get status() {
      return this._status;
   }

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      super();

      this.options = { ...defaultClientOptions.voice, ...options };
      this.localVoiceState = { isAudioDeafened: false, isAudioMuted: false, isAudioPaused: false, isStreaming: false, isCameraOn: false };
      this.client = client;
      this.consumers = new Map();
      this.producers = new Map();
      this.listeners = new WeakMap();
   }

   public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
      if (this.status === "opening" || this.socket) {
         return;
      }

      log("api:voice", "default", "connect", "cid:", channelId, "gid:", guildId);

      this.socket = this.options.createSocket(this.options.url);
      this.connectionInfo = { token, channelId, guildId };
      this.startListening();

      this.status = "opening";
   }

   /**
    * This function is called from gateway's disconnectVoice()
    *
    * Do not call this only by it self. Update the voice state to a null channel and guild id and THEN close voice
    */
   public close(): void {
      log("api:voice", "default", "intentional close");

      // We set this so it won't try to reconnect again. (it will log it but will fail to do so)
      this.connectionInfo = undefined;

      this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
   }

   private onOpen(_e: Event) {
      log("api:voice", "default", "connected");

      this.status = "connecting";
      this.emit("open", undefined);
   }

   private async onClose(e: CloseEvent) {
      log("api:voice", "default", "closed", "c:", e.code, "r:", e.reason);

      this.status = "disconnected";
      this.stopHeartbeat();
      this.stopPing();
      this.reset();

      this.emit("close", e.code);

      // Completely reset by setting connection info to undefined
      if (e.code === GatewayCode.INTENTIONAL_CLOSE) {
         this.connectionInfo = undefined;
         return;
      }

      this.tryReconnect(e);
   }

   private tryReconnect(e: CloseEvent) {
      setTimeout(async () => {
         log("api:voice", "default", "try reconnect");

         // If we are able to reconnect
         if (this.connectionInfo) {
            this.status = "reconnecting";

            if (this.client.gateway.status !== "authenticated") {
               await this.client.gateway.waitForEvents(["ready", "resumed"], true);
            }

            // If we had a token failure last time, don't include a token to get a new one.
            const token = e.code === GatewayCode.AUTHENTICATION_FAILED ? undefined : this.connectionInfo.token;
            await this.client.gateway.connectVoice(
               this.connectionInfo.guildId,
               this.connectionInfo.channelId,
               { isAudioDeafened: this.localVoiceState.isAudioDeafened, isAudioMuted: this.localVoiceState.isAudioMuted },
               token,
               !token,
            );
         }
      }, 2000);
   }

   public async startMicrophone(microphoneTrack: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      log("api:voice", "default", "start microphone");

      const microphoneProducer = this.producers.get("microphone");
      if (microphoneProducer) {
         microphoneProducer.replaceTrack({ track: microphoneTrack });
      } else {
         await this.openProducer("microphone", {
            track: microphoneTrack,
            appData: { mediaKind: "microphone", userId: this.client.user.id },
         });
      }

      // Mute the microphone producer immediately when local voice state is audio muted
      if (this.localVoiceState.isAudioMuted) {
         this.producers.get("microphone")?.pause();
      }
   }

   public async startCamera(cameraTrack: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      log("api:voice", "default", "start camera");

      await this.openProducer("camera", {
         track: cameraTrack,
         appData: { mediaKind: "camera", userId: this.client.user.id },
      });

      await this.client.gateway.updateVoiceState({
         isAudioDeafened: this.localVoiceState.isAudioDeafened,
         isAudioMuted: this.localVoiceState.isAudioMuted,
         isCameraOn: true,
         isStreaming: this.localVoiceState.isStreaming,
      });
   }

   public async stopCamera(): Promise<void> {
      if (!this.connectionInfo) {
         return;
      }

      log("api:voice", "default", "stop camera");

      const cameraProducer = this.producers.get("camera");

      if (cameraProducer) {
         await this.closeProducer(cameraProducer.id);
      }

      await this.client.gateway.updateVoiceState({
         isAudioDeafened: this.localVoiceState.isAudioDeafened,
         isAudioMuted: this.localVoiceState.isAudioMuted,
         isCameraOn: false,
         isStreaming: this.localVoiceState.isStreaming,
      });
   }

   public async startStream(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
      if (!this.sendTransport || !this.client.user) {
         return;
      }

      log("api:voice", "default", "start stream");

      const videoProducer = this.producers.get("stream_video");
      const audioProducer = this.producers.get("stream_audio");

      if (videoTrack) {
         videoTrack.onended = async () => {
            await this.stopStream();
         };

         if (videoProducer) {
            await videoProducer.replaceTrack({ track: videoTrack });
         } else {
            await this.openProducer("stream_video", {
               track: videoTrack,
               appData: { mediaKind: "stream_video", userId: this.client.user.id },
               encodings: [{ scalabilityMode: "L1T3" }],
               codecOptions: { videoGoogleStartBitrate: 1000000, videoGoogleMinBitrate: 10000, videoGoogleMaxBitrate: 3000000 },
            });
         }
      }

      if (audioTrack) {
         if (audioProducer) {
            await audioProducer.replaceTrack({ track: audioTrack });
         } else {
            await this.openProducer("stream_audio", {
               track: audioTrack,
               appData: { mediaKind: "stream_audio", userId: this.client.user.id },
               codecOptions: { opusStereo: true, opusMaxAverageBitrate: 1000000 },
            });
         }
      }

      await Promise.allSettled([
         audioProducer && !audioTrack && this.closeProducer(audioProducer.id),
         videoProducer && !videoTrack && this.closeProducer(videoProducer.id),
      ]);

      await this.client.gateway.updateVoiceState({
         isAudioDeafened: this.localVoiceState.isAudioDeafened,
         isAudioMuted: this.localVoiceState.isAudioMuted,
         isCameraOn: this.localVoiceState.isCameraOn,
         isStreaming: true,
      });
   }

   public async stopStream(): Promise<void> {
      if (!this.connectionInfo) {
         return;
      }

      log("api:voice", "default", "stop stream");

      const videoProducer = this.producers.get("stream_video");
      const audioProducer = this.producers.get("stream_audio");

      await Promise.allSettled([videoProducer && this.closeProducer(videoProducer.id), audioProducer && this.closeProducer(audioProducer.id)]);

      await this.client.gateway.updateVoiceState({
         isAudioDeafened: this.localVoiceState.isAudioDeafened,
         isAudioMuted: this.localVoiceState.isAudioMuted,
         isCameraOn: this.localVoiceState.isCameraOn,
         isStreaming: false,
      });
   }

   public async consumeProducer(producerId: string): Promise<void> {
      if (!this.connectionInfo || !this.recvTransport || !this.device) {
         return;
      }

      log("api:voice", "default", "consume producer", "pid:", producerId);

      const consumeData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "consume",
         d: {
            channelId: this.connectionInfo.channelId,
            producerId: producerId,
            rtpCapabilities: this.device.rtpCapabilities,
            transportId: this.recvTransport.id,
         },
      };

      log("api:voice", "send", "consume", "pid:", producerId);
      this.send(consumeData);

      await new Promise<void>((r) => {
         const unlisten = this.listen("consumer_created", (d) => {
            if (d.producerId === producerId) {
               unlisten();
               r();
            }
         });
      });
   }

   public updateLocalVoiceState(voiceState: Partial<typeof this.localVoiceState>): void {
      if (voiceState.isAudioPaused !== undefined) {
         log("api:voice", "local-voice-state", "set audio paused:", voiceState.isAudioPaused);

         this.localVoiceState.isAudioPaused = voiceState.isAudioPaused;

         const producer = this.producers.get("microphone");
         if (voiceState.isAudioPaused === true && !producer?.paused) {
            producer?.pause();
            this.localVoiceState.isAudioPaused = true;
         } else if (voiceState.isAudioPaused === false && !this.localVoiceState?.isAudioMuted && producer?.paused) {
            producer.resume();
            this.localVoiceState.isAudioPaused = false;
            // return true;
         }
      }
      if (voiceState.isAudioMuted !== undefined) {
         log("api:voice", "local-voice-state", "set audio muted:", voiceState.isAudioMuted);

         this.localVoiceState.isAudioMuted = voiceState.isAudioMuted;

         const producer = this.producers.get("microphone");
         if (voiceState.isAudioMuted === true && !producer?.paused) {
            producer?.pause();
         } else if (voiceState.isAudioMuted === false && !this.localVoiceState.isAudioPaused && producer?.paused) {
            producer?.resume();
         }
      }
      if (voiceState.isAudioDeafened !== undefined) {
         log("api:voice", "local-voice-state", "set audio deafened:", voiceState.isAudioDeafened);

         this.localVoiceState.isAudioDeafened = voiceState.isAudioDeafened;

         for (const consumer of this.consumers.values()) {
            if (
               voiceState.isAudioDeafened === true &&
               !consumer.paused &&
               (consumer.appData.mediaKind === "stream_audio" || consumer.appData.mediaKind === "microphone")
            ) {
               consumer.pause();
            } else if (voiceState.isAudioDeafened === false && consumer.paused) {
               consumer.resume();
            }
         }
      }
      if (voiceState.isStreaming !== undefined) {
         log("api:voice", "local-voice-state", "set streaming:", voiceState.isStreaming);

         this.localVoiceState.isStreaming = voiceState.isStreaming;
      }
      if (voiceState.isCameraOn !== undefined) {
         log("api:voice", "local-voice-state", "set camera on:", voiceState.isCameraOn);

         this.localVoiceState.isCameraOn = voiceState.isCameraOn;
      }

      log(
         "api:voice",
         "local-voice-state",
         "update",
         "am:",
         this.localVoiceState.isAudioMuted,
         "ap:",
         this.localVoiceState.isAudioPaused,
         "ad:",
         this.localVoiceState.isAudioDeafened,
         "s:",
         this.localVoiceState.isStreaming,
         "co:",
         this.localVoiceState.isCameraOn,
      );

      this.emit("local_voice_state_changed", this.localVoiceState);
   }

   public closeConsumer(consumerId: string): void {
      if (!this.connectionInfo) {
         return;
      }

      log("api:voice", "default", "close consumer", "id:", consumerId);

      const closeConsumerData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "close_consumer",
         d: { channelId: this.connectionInfo.channelId, consumerId: consumerId },
      };

      log("api:voice", "send", "close-consumer", "id:", consumerId);
      this.send(closeConsumerData);
   }

   private async openProducer(kind: HMediaKind, options: ProducerOptions<MediasoupAppData>) {
      if (!this.sendTransport || !options.track) {
         return;
      }

      const existingProducer = this.producers.get(kind);
      if (existingProducer) {
         await this.closeProducer(existingProducer.id);
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

   private async closeProducer(producerId: string) {
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

      await new Promise<void>((r) => {
         const unlisten = this.listen("producer_closed", (d) => {
            if (d.producerId === producerId) {
               unlisten();
               r();
            }
         });
      });
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

      this.sequence = undefined;
      this.socket = undefined;

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
                  break;
               case "producer_closed":
                  log("api:voice", "recv", "producer closed", "id:", data.d.producerId);
                  this.handleProducerClosed(data.d);
                  break;
               case "consumer_closed":
                  log("api:voice", "recv", "consumer closed", "id:", data.d.consumerId);
                  this.handleConsumerClosed(data.d);
                  break;
            }

            this.emit(data.t, data.d);
            break;
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

      if (this.localVoiceState.isAudioDeafened) {
         consumer.pause();
      }

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

   private async handleTransportCreated(data: VoiceTransportCreatedData) {
      if (!this.connectionInfo) {
         return;
      }

      try {
         if (data.direction === "send") {
            this.sendTransport = this.device?.createSendTransport(data.params);

            this.sendTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
               if (!this.connectionInfo) {
                  errback(new Error("Connection info is undefined"));
                  return;
               }

               const connectTransportData: VoicePayload = {
                  op: VoiceOperations.DISPATCH,
                  t: "connect_transport",
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and sendTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.sendTransport!.id, dtlsParameters },
               };

               log("api:voice", "send", "connect transport", "id:", this.sendTransport?.id, "dir:", "send");
               this.send(connectTransportData);

               // Wait for the transport to get connected
               await new Promise<void>((r) => {
                  const unlisten = this.listen("transport_connected", (d) => {
                     if (d.transportId === this.sendTransport?.id) {
                        unlisten();
                        r();
                     }
                  });
               });

               callback();
            });

            this.sendTransport?.on("produce", async ({ rtpParameters, appData }, callback, errback) => {
               if (!this.connectionInfo || !this.sendTransport) {
                  errback(new Error("Connection info or send transport is undefined"));
                  return;
               }

               const kind = (appData as MediasoupAppData).mediaKind;

               const produceData: VoicePayload = {
                  op: VoiceOperations.DISPATCH,
                  t: "produce",
                  d: {
                     channelId: this.connectionInfo.channelId,
                     transportId: this.sendTransport.id,
                     kind: kind,
                     rtpParameters,
                  },
               };

               log("api:voice", "send", "produce", "mk:", appData.mediaKind);
               this.send(produceData);

               // Wait for the producer to be created
               const result = await new Promise<VoiceProducerCreatedData>((r) => {
                  const unlisten = this.listen("producer_created", (d) => {
                     if (d.kind === kind) {
                        unlisten();
                        r(d);
                     }
                  });
               });

               callback({ id: result.producerId });
            });

            this.emit("send_transport_ready", { channelId: this.connectionInfo.channelId });
         } else if (data.direction === "recv") {
            this.recvTransport = this.device?.createRecvTransport(data.params);

            this.recvTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
               if (!this.connectionInfo) {
                  errback(new Error("Connection info is undefined"));
                  return;
               }

               const connectTransportData: VoicePayload = {
                  op: VoiceOperations.DISPATCH,
                  t: "connect_transport",
                  // biome-ignore lint/style/noNonNullAssertion: connectionInfo and recvTransport cannot be null here
                  d: { channelId: this.connectionInfo!.channelId, transportId: this.recvTransport!.id, dtlsParameters },
               };

               log("api:voice", "send", "connect-transport", "id:", this.recvTransport?.id, "dir:", "recv");
               this.send(connectTransportData);

               // Wait for the transport to get connected
               await new Promise<void>((r) => {
                  const unlisten = this.listen("transport_connected", (d) => {
                     if (d.transportId === this.recvTransport?.id) {
                        unlisten();
                        r();
                     }
                  });
               });

               callback();
            });

            this.emit("recv_transport_ready", { channelId: this.connectionInfo.channelId });

            // Emit all initial producers as "new producers"
            if (this.initialProducers) {
               for (const producer of this.initialProducers) {
                  this.emit("new_producer", producer);
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
   }

   private handleConsumerClosed(data: VoiceConsumerClosedData) {
      const consumer = this.consumers.get(data.consumerId);
      if (consumer) {
         consumer.close();
         this.consumers.delete(data.consumerId);
      }
   }

   private async handleReady(data: VoiceReadyData) {
      if (!this.connectionInfo) {
         return;
      }

      this.status = "authenticated";
      this.initialProducers = data.producers;

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

      // Wait for the transport ready events
      let recvTransportReady = false;
      let sendTransportReady = false;
      await new Promise<void>((r) => {
         const unlisten = this.listen("transport_created", (d) => {
            if (d.transportId === this.sendTransport?.id) {
               sendTransportReady = true;
            } else if (d.transportId === this.recvTransport?.id) {
               recvTransportReady = true;
            }

            if (sendTransportReady && recvTransportReady) {
               unlisten();
               this.status = "rtc_ready";
               r();
            }
         });
      });

      this.sendPing();
   }

   private async handleHello(data: VoiceHelloData) {
      this.status = "connected";

      this.startHeartbeat(data.heartbeatInterval);

      if (!this.client.user || !this.connectionInfo) {
         error("api:voice", "Client user or connection info was null when identifying voice websocket");
         return;
      }

      const identify: VoiceIdentify = {
         op: VoiceOperations.IDENTIFY,
         d: {
            token: this.connectionInfo.token,
            channelId: this.connectionInfo.channelId,
            guildId: this.connectionInfo.guildId,
         },
      };

      log("api:voice", "send", "identify", "cid:", identify.d.channelId, "gid:", identify.d.guildId, "tkn:", identify.d.token);
      this.send(identify);
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
