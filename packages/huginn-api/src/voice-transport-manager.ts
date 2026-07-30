import type {
   Consumer,
   DtlsParameters,
   Producer,
   ProducerCodecOptions,
   RtpCapabilities,
   RtpParameters,
   Transport,
   TransportOptions,
   RtpEncodingParameters,
   ConnectionState,
   DeviceOptions,
} from "mediasoup-client/types";

import {
   analytics,
   convertToMediaKind,
   EventEmitter,
   recordSpanError,
   type ConsumerData,
   type GatewayVoiceStateFlags,
   type HMediaKind,
   type LocalVoiceState,
   type MediasoupAppData,
   type ProducerData,
   type Snowflake,
   type VoiceCloseConsumerResult,
   type VoiceCloseProducerResult,
   type VoiceConnectTransportResult,
   type VoiceConsumeResult,
   type VoicePauseConsumerResult,
   type VoicePreference,
   type VoiceProduceResult,
   type VoiceRestartIceResult,
   type VoiceResumeConsumerResult,
} from "@huginnjs/shared";
import * as mediasoupClient from "mediasoup-client";

import { TransportError, type HuginnClient } from ".";

type Events = {
   send_transport_ready: undefined;
   recv_transport_ready: undefined;
   connect_transport: {
      transportId: string;
      dtlsParameters: DtlsParameters;
      callback: (d: VoiceConnectTransportResult) => void;
   };
   restart_ice: { transportId: string; callback: (d: VoiceRestartIceResult) => void };

   create_producer: {
      kind: HMediaKind;
      transportId: string;
      rtpParameters: RtpParameters;
      callback: (d: VoiceProduceResult) => void;
   };
   close_producer: { id: string; kind: HMediaKind; callback: (d: VoiceCloseProducerResult) => void };
   producer_updated: { id: string; kind: HMediaKind; track: MediaStreamTrack | null };
   producer_created: Producer<MediasoupAppData>;
   producer_closed: ProducerData;
   remote_producer_created: ProducerData;
   remote_producer_closed: ProducerData;

   create_consumer: {
      producerId: string;
      transportId: string;
      rtpCapabilities: RtpCapabilities;
      callback: (d: VoiceConsumeResult) => void;
      // errback: (d: VoiceConsumeResultData) => void;
   };
   resume_consumer: { id: string; callback: (d: VoiceResumeConsumerResult) => void };
   pause_consumer: { id: string; callback: (d: VoicePauseConsumerResult) => void };
   close_consumer: { id: string; callback: (d: VoiceCloseConsumerResult) => void };
   consumer_created: Consumer<MediasoupAppData>;
   consumer_closed: ConsumerData;
   remote_consumer_created: ConsumerData;
   remote_consumer_closed: ConsumerData;

   transport_disconnected: { direction: "send" | "recv" };

   status_changed: TransportManagerStatus;
   reset: undefined;
};

type TransportManagerStatus = "idle" | "disconnected" | "ready" | "restarting";

type Options = {
   deviceOptions?: DeviceOptions;
};

export class VoiceTransportManager extends EventEmitter<Events> {
   private client: HuginnClient;
   public device?: mediasoupClient.Device;
   public sendTransport?: Transport;
   public recvTransport?: Transport;
   public remoteProducers: Map<string, ProducerData> = new Map();
   public remoteConsumers: Map<string, ConsumerData> = new Map();
   public producers: Map<HMediaKind, Producer<MediasoupAppData>> = new Map();
   public consumers: Map<string, Consumer<MediasoupAppData>> = new Map();
   private options?: Options;

   private pendingRemoteProducers = new Map<string, ProducerData>();

   private _status: TransportManagerStatus = "idle";
   public get status(): TransportManagerStatus {
      return this._status;
   }

   public constructor(client: HuginnClient, options?: Options) {
      super();
      this.client = client;
      this.options = options;
   }

   private getDefaultAttributes() {
      return {
         "voice.user.id": this.client.currentUser?.id ?? "null",
         "voice.transport.status": this.status,
         "voice.transport.has_device": !!this.device,
         "voice.transport.send_state": this.sendTransport?.connectionState ?? "none",
         "voice.transport.recv_state": this.recvTransport?.connectionState ?? "none",
         "voice.transport.producer_count": this.producers.size,
         "voice.transport.consumer_count": this.consumers.size,
         "voice.transport.remote_producer_count": this.remoteProducers.size,
         "voice.transport.remote_consumer_count": this.remoteConsumers.size,
      };
   }

   private setStatus(newStatus: TransportManagerStatus) {
      this._status = newStatus;
      this.emit("status_changed", newStatus);
   }

   private checkAndSetStatus() {
      if (this.recvTransport && this.sendTransport) {
         const sendStatus = this.sendTransport.connectionState;
         const recvStatus = this.recvTransport.connectionState;

         if ((sendStatus === "new" || sendStatus === "connected") && (recvStatus === "new" || recvStatus === "connected")) {
            this.setStatus("ready");

            // When transports are not connected and a remote producer is added, it gets into a pending list which then gets flushed here
            if (this.pendingRemoteProducers.size !== 0) {
               for (const tempProducer of this.pendingRemoteProducers.values()) this.addRemoteProducer(tempProducer);
               this.pendingRemoteProducers.clear();
            }
         }
      }
   }

   private async onTransportStateChanged(state: ConnectionState, _direction: "send" | "recv") {
      if ((state === "disconnected" || state === "failed") && this.status !== "restarting") {
         this.setStatus("disconnected");
      } else {
         this.checkAndSetStatus();
      }
   }

   public async checkAndRestartIce(): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.checkAndRestartIce", async (span) => {
         span.setAttributes(this.getDefaultAttributes());

         try {
            this.checkRecvTransport();
            this.checkSendTransport();
            const sendStatus = this.sendTransport.connectionState;
            const recvStatus = this.recvTransport.connectionState;

            if (sendStatus === "disconnected" || sendStatus === "failed" || recvStatus === "disconnected" || recvStatus === "failed") {
               await this.restartIce("send");
               await this.restartIce("recv");
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public cancelRestartIce(): void {
      this.setStatus("disconnected");
   }

   public checkDevice(): asserts this is this & {
      device: mediasoupClient.Device;
   } {
      if (!this.device) {
         throw new TransportError("Transport manager's device is not initialized");
      }
   }

   public checkSendTransport(): asserts this is this & {
      device: mediasoupClient.Device;
      sendTransport: Transport<MediasoupAppData>;
   } {
      this.checkDevice();
      if (!this.sendTransport) throw new TransportError("Transport manager's send transport is not initialized");
   }

   public checkRecvTransport(): asserts this is this & {
      device: mediasoupClient.Device;
      recvTransport: Transport<MediasoupAppData>;
   } {
      this.checkDevice();
      if (!this.recvTransport) throw new TransportError("Transport manager's recv transport is not initialized");
   }

   public async initializeDevice(rtpCapabilities: RtpCapabilities): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.initializeDevice", async (span) => {
         span.setAttributes(this.getDefaultAttributes());

         try {
            this.device = new mediasoupClient.Device(this.options?.deviceOptions);
            await this.device.load({ routerRtpCapabilities: rtpCapabilities });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async createSendTransport(options: TransportOptions): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.createSendTransport", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.transport.direction": "send",
         });

         try {
            this.checkDevice();

            const iceServers = await this.fetchTurnCredentials();
            const transport = this.device.createSendTransport({ ...options, iceServers });
            this.sendTransport = transport;
            this.emit("send_transport_ready", undefined);

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
               this.emit("connect_transport", {
                  transportId: transport.id,
                  dtlsParameters,
                  callback: (d) => {
                     if ("error" in d) {
                        errback(new TransportError(`Failed to connect send transport: ${d.error}`, d.error));
                        return;
                     }
                     callback();
                  },
               });
            });

            transport.on("produce", async ({ rtpParameters, appData }, callback, errback) => {
               const kind = (appData as MediasoupAppData).mediaKind;

               this.emit("create_producer", {
                  kind,
                  transportId: transport.id,
                  rtpParameters,
                  callback: (d) => {
                     if ("error" in d) {
                        errback(new TransportError(`Failed to create producer: ${d.error}`, d.error));
                        return;
                     }

                     callback({ id: d.producerId });
                  },
               });
            });

            transport.on("connectionstatechange", async (d) => await this.onTransportStateChanged(d, transport.direction));
            this.checkAndSetStatus();
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async createRecvTransport(options: TransportOptions): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.createRecvTransport", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.direction": "recv",
         });

         try {
            this.checkDevice();

            const iceServers = await this.fetchTurnCredentials();
            const finalOptions = { ...options, iceServers };
            const transport = this.device.createRecvTransport(finalOptions);
            this.recvTransport = transport;
            this.emit("recv_transport_ready", undefined);

            transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
               this.emit("connect_transport", {
                  transportId: transport.id,
                  dtlsParameters,
                  callback: (d) => {
                     if ("error" in d) {
                        errback(new TransportError(`Failed to connect receive transport: ${d.error}`, d.error));
                        return;
                     }
                     callback();
                  },
               });
            });

            transport.on("connectionstatechange", async (d) => await this.onTransportStateChanged(d, transport.direction));
            this.checkAndSetStatus();
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private async fetchTurnCredentials(): Promise<RTCIceServer[] | undefined> {
      return await analytics.startActiveSpan("apiVoiceTransport.fetchTurnCredentials", async (span) => {
         span.setAttributes(this.getDefaultAttributes());

         try {
            const id = typeof process !== "undefined" ? process.env.VITE_PUBLIC_CLOUDFLARE_TURN_ID : import.meta.env.VITE_PUBLIC_CLOUDFLARE_TURN_ID;
            const token = typeof process !== "undefined" ? process.env.VITE_PUBLIC_CLOUDFLARE_TURN_TOKEN : import.meta.env.VITE_PUBLIC_CLOUDFLARE_TURN_TOKEN;
            span.setAttributes({
               "turn.has_id": !!id,
               "turn.has_token": !!token,
            });

            const data = { ttl: 86400 };
            const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${id}/credentials/generate-ice-servers`, {
               headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
               body: JSON.stringify(data),
               method: "POST",
            });
            const json = await response.json();
            return json.iceServers;
         } catch (e) {
            recordSpanError(e);
            return undefined;
         }
      });
   }

   public async createProducer(
      kind: HMediaKind,
      track: MediaStreamTrack,
      options?: { codecOptions?: ProducerCodecOptions; encodings?: RtpEncodingParameters[] },
   ): Promise<Producer<MediasoupAppData>> {
      return await analytics.startActiveSpan("apiVoiceTransport.createProducer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.media.kind": kind,
            "params.track.id": track.id,
            "params.track.kind": track.kind,
         });

         try {
            this.checkSendTransport();

            if (this.producers.has(kind)) throw new TransportError(`Producer with kind ${kind} already exists`);

            const producer = await this.sendTransport.produce<MediasoupAppData>({
               codecOptions: options?.codecOptions,
               encodings: options?.encodings,
               appData: { mediaKind: kind, userId: this.client.currentUser!.id },
               track,
            });

            this.producers.set(kind, producer);

            track.onended = () => {
               this.closeProducer(kind);
            };

            this.emit("producer_created", producer);

            return producer;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async closeProducer(kind: HMediaKind): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.closeProducer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.media.kind": kind,
         });

         try {
            const producer = this.producers.get(kind);
            if (!producer) throw new TransportError(`Producer of kind ${kind} doesn't exist`);

            const result = await new Promise<VoiceCloseProducerResult>((res) => {
               this.emit("close_producer", { id: producer.id, kind: producer.appData.mediaKind, callback: res });
            });

            if ("error" in result) {
               throw new TransportError(`Failed to close producer: ${result.error}`, result.error);
            }

            producer.close();
            this.producers.delete(producer.appData.mediaKind);
            this.emit("producer_closed", {
               producerId: producer.id,
               kind: producer.appData.mediaKind,
               userId: producer.appData.userId,
            });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async createConsumer(userId: Snowflake, kind: HMediaKind): Promise<Consumer<MediasoupAppData>> {
      return await analytics.startActiveSpan("apiVoiceTransport.createConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.user.id": userId,
            "params.media.kind": kind,
         });

         try {
            this.checkRecvTransport();

            const remoteProducer = this.getRemoteProducers().find((x) => x.userId === userId && x.kind === kind);
            if (!remoteProducer) throw new TransportError(`Remote producer from user ${userId} and kind of ${kind} doesn't exist`);

            const createResult = await new Promise<VoiceConsumeResult>((res) => {
               this.emit("create_consumer", {
                  producerId: remoteProducer.producerId,
                  rtpCapabilities: this.device.recvRtpCapabilities,
                  transportId: this.recvTransport.id,
                  callback: res,
               });
            });

            if ("error" in createResult) {
               throw new TransportError(`Failed to create consumer: ${createResult.error}`, createResult.error);
            }

            const consumer = await this.recvTransport.consume({
               id: createResult.consumerId,
               producerId: createResult.producerId,
               appData: { mediaKind: createResult.kind, userId: createResult.producerUserId },
               rtpParameters: createResult.rtpParameters,
               kind: convertToMediaKind(createResult.kind),
            });

            // To avoid a race condition that could happen when consumer is created and right after that the producer is removed
            if (!this.remoteProducers.has(remoteProducer.producerId)) {
               consumer.close();
               throw new TransportError(`Remote producer with id ${remoteProducer.producerId} was deleted`);
            }

            this.consumers.set(consumer.id, consumer);
            this.emit("consumer_created", consumer);

            consumer.pause();

            // await this.resumeConsumer(consumer.id);

            return consumer;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async resumeConsumer(consumerId: string): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.resumeConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer.id": consumerId,
         });

         try {
            const consumer = this.consumers.get(consumerId);
            if (!consumer) throw new TransportError(`Consumer with id ${consumerId} doesn't exist`);

            const result = await new Promise<VoiceResumeConsumerResult>((res) => {
               this.emit("resume_consumer", { id: consumerId, callback: res });
            });

            if ("error" in result) {
               throw new TransportError(`Failed to resume consumer: ${result.error}`, result.error);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async pauseConsumer(consumerId: string): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.pauseConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer.id": consumerId,
         });

         try {
            const consumer = this.consumers.get(consumerId);
            if (!consumer) throw new TransportError(`Consumer with id ${consumerId} doesn't exist`);

            const result = await new Promise<VoicePauseConsumerResult>((res) => {
               this.emit("pause_consumer", { id: consumerId, callback: res });
            });

            if ("error" in result) {
               throw new TransportError(`Failed to pause consumer: ${result.error}`, result.error);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async closeConsumer(consumerId: string, skipSignalling: boolean = false): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.closeConsumer", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer.id": consumerId,
            "params.consumer.skip_signalling": skipSignalling,
         });

         try {
            this.checkDevice();

            const consumer = this.consumers.get(consumerId);
            if (!consumer) throw new TransportError(`Consumer with id ${consumerId} doesn't exist`);

            if (!skipSignalling) {
               const result = await new Promise<VoiceCloseConsumerResult>((res) => {
                  this.emit("close_consumer", { id: consumerId, callback: res });
               });

               if ("error" in result) {
                  throw new TransportError(`Failed to close consumer: ${result.error}`, result.error);
               }
            }

            consumer.close();
            this.consumers.delete(consumer.id);
            this.emit("consumer_closed", {
               consumerId: consumer.id,
               kind: consumer.appData.mediaKind,
               producerId: consumer.producerId,
               userId: consumer.appData.userId,
            });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async restartIce(direction: "send" | "recv"): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.restartIce", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.transport.direction": direction,
         });

         try {
            if (direction === "send") {
               this.checkSendTransport();
            } else {
               this.checkRecvTransport();
            }

            // It could happen that restarting a transport causes the other one to also reconnect
            this.checkAndSetStatus();
            if (this.status === "ready") return;

            const transport = (direction === "send" ? this.sendTransport : this.recvTransport)!;

            this.setStatus("restarting");

            const result = await new Promise<VoiceRestartIceResult>((res) => {
               this.emit("restart_ice", { transportId: transport.id, callback: res });
            });

            if ("error" in result) {
               throw new TransportError(`Failed to restart ice server for ${direction} transport: ${result.error}`, result.error);
            }

            await transport.restartIce({ iceParameters: result.iceParameters });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async applyVoiceState(
      gatewayVoiceState: GatewayVoiceStateFlags,
      localVoiceState: LocalVoiceState,
      voicePreferences: VoicePreference[],
   ): Promise<void> {
      const micProducer = this.producers.get("microphone");

      if (micProducer) {
         const shouldBePaused = localVoiceState.isAudioPaused === true || gatewayVoiceState.isAudioMuted === true;

         if (shouldBePaused && !micProducer.paused) {
            micProducer.pause();
         } else if (!shouldBePaused && micProducer.paused) {
            micProducer.resume();
         }
      }

      let promises: Promise<void>[] = [];
      for (const consumer of this.consumers.values()) {
         if (consumer.appData.mediaKind !== "stream_audio" && consumer.appData.mediaKind !== "microphone") {
            // no other kind of consumer should be paused.
            if (consumer.paused) {
               promises.push(this.resumeConsumer(consumer.id));
               consumer.resume();
            }
            continue;
         }

         const voicePreference = voicePreferences.find((x) => x.userId === consumer.appData.userId);
         const isMuted =
            consumer.appData.mediaKind === "microphone"
               ? voicePreference?.isMicrophoneMuted
               : consumer.appData.mediaKind === "stream_audio"
                 ? voicePreference?.isStreamMuted
                 : false;

         // If state is deafened consume is not paused, pause consumer
         if ((gatewayVoiceState.isAudioDeafened === true || isMuted === true) && !consumer.paused) {
            promises.push(this.pauseConsumer(consumer.id));
            consumer.pause();
         }
         // If state is not deafened, consumer is paused, resume consumer
         else if (gatewayVoiceState.isAudioDeafened === false && isMuted === false && consumer.paused) {
            promises.push(this.resumeConsumer(consumer.id));
            consumer.resume();
         }
      }

      await Promise.all(promises);
   }

   public async replaceProducerTrack(kind: HMediaKind, track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceTransport.replaceProducerTrack", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.media.kind": kind,
            "params.track.id": track.id,
            "params.track.kind": track.kind,
         });

         try {
            const producer = this.producers.get(kind);
            if (!producer) throw new TransportError(`No producer with kind ${kind} was found`);

            await producer.replaceTrack({ track });
            this.emit("producer_updated", { id: producer.id, kind: producer.appData.mediaKind, track });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public getProducer(kind: HMediaKind): Producer<MediasoupAppData> | undefined {
      return this.producers.get(kind);
   }

   public getConsumer(userId: Snowflake, kind: HMediaKind): Consumer<MediasoupAppData> | undefined {
      return Array.from(this.consumers.values()).find((x) => x.appData.userId === userId && x.appData.mediaKind === kind);
   }

   public getConsumers(): Consumer<MediasoupAppData>[] {
      return Array.from(this.consumers.values());
   }

   public getProducers(): Producer<MediasoupAppData>[] {
      return Array.from(this.producers.values());
   }

   public getRemoteProducers(): ProducerData[] {
      return Array.from(this.remoteProducers.values());
   }

   public getRemoteConsumers(): ConsumerData[] {
      return Array.from(this.remoteConsumers.values());
   }

   public addRemoteProducer(producer: ProducerData): void {
      analytics.startActiveSpan("apiVoiceTransport.addRemoteProducer", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.producer.id": producer.producerId,
            "params.media.kind": producer.kind,
            "params.user.id": producer.userId,
         });

         if (!this.recvTransport) {
            this.pendingRemoteProducers?.set(producer.producerId, producer);
            return;
         }

         this.remoteProducers.set(producer.producerId, producer);
         this.emit("remote_producer_created", producer);
      });
   }

   public addRemoteConsumer(consumer: ConsumerData): void {
      analytics.startActiveSpan("apiVoiceTransport.addRemoteConsumer", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer.id": consumer.consumerId,
            "params.producer.id": consumer.producerId,
            "params.media.kind": consumer.kind,
            "params.user.id": consumer.userId,
         });

         this.remoteConsumers.set(consumer.consumerId, consumer);
         this.emit("remote_consumer_created", consumer);
      });
   }

   public removeRemoteProducer(producerId: string): void {
      analytics.startActiveSpan("apiVoiceTransport.removeRemoteProducer", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.producer.id": producerId,
         });

         const producer = this.remoteProducers.get(producerId);
         if (!producer) return;

         this.remoteProducers.delete(producerId);
         this.emit("remote_producer_closed", producer);
      });
   }

   public removeRemoteConsumer(consumerId: string): void {
      analytics.startActiveSpan("apiVoiceTransport.removeRemoteConsumer", (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.consumer.id": consumerId,
         });

         const consumer = this.remoteConsumers.get(consumerId);
         if (!consumer) return;

         this.remoteConsumers.delete(consumerId);
         this.emit("remote_consumer_closed", consumer);
      });
   }

   public reset(): void {
      analytics.startActiveSpan("apiVoiceTransport.reset", (span) => {
         span.setAttributes(this.getDefaultAttributes());

         this.sendTransport?.close();
         this.recvTransport?.close();

         this.device = undefined;
         this.sendTransport = undefined;
         this.recvTransport = undefined;

         this.remoteProducers.clear();
         this.remoteConsumers.clear();

         this.producers.clear();
         this.consumers.clear();

         this.setStatus("idle");
         this.emit("reset", undefined);
      });
   }
}
