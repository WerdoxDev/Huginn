import {
   convertToMediaKind,
   error,
   log,
   type ConsumerData,
   type GatewayVoiceStateFlags,
   type HMediaKind,
   type LocalVoiceState,
   type MediasoupAppData,
   type ProducerData,
   type Snowflake,
   type VoiceConsumerCreatedData,
} from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
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
} from "mediasoup-client/types";
import { EventEmitter } from "./event-emitter";
import type { HuginnClient } from ".";

type Events = {
   send_transport_ready: undefined;
   recv_transport_ready: undefined;
   connect_transport: { transportId: string; dtlsParameters: DtlsParameters; callback: () => void };

   create_producer: {
      kind: HMediaKind;
      transportId: string;
      rtpParameters: RtpParameters;
      callback: (id: string) => void;
   };
   close_producer: { id: string; callback: () => void };
   producer_updated: { id: string; kind: HMediaKind; track: MediaStreamTrack | null };
   producer_created: Producer<MediasoupAppData>;
   producer_closed: ProducerData;
   remote_producer_created: ProducerData;
   remote_producer_closed: ProducerData;

   create_consumer: {
      producerId: string;
      transportId: string;
      rtpCapabilities: RtpCapabilities;
      callback: (d: VoiceConsumerCreatedData) => void;
   };
   resume_consumer: { id: string; callback: () => void };
   close_consumer: { id: string; callback: () => void };
   consumer_created: Consumer<MediasoupAppData>;
   consumer_closed: ConsumerData;
   remote_consumer_created: ConsumerData;
   remote_consumer_closed: ConsumerData;

   transport_disconnected: { direction: "send" | "recv" };

   status_changed: TransportManagerStatus;
   reset: undefined;
};

type TransportManagerStatus = "idle" | "disconnected" | "ready";

export class VoiceTransportManager extends EventEmitter<Events> {
   private client: HuginnClient;
   public device?: mediasoupClient.Device;
   public sendTransport?: Transport<MediasoupAppData>;
   public recvTransport?: Transport;
   public remoteProducers: Map<string, ProducerData> = new Map();
   public remoteConsumers: Map<string, ConsumerData> = new Map();
   public producers: Map<HMediaKind, Producer<MediasoupAppData>> = new Map();
   public consumers: Map<string, Consumer<MediasoupAppData>> = new Map();

   private pendingRemoteProducers: Map<string, ProducerData> = new Map();

   private _status: TransportManagerStatus = "idle";
   public get status(): TransportManagerStatus {
      return this._status;
   }

   public constructor(client: HuginnClient) {
      super();
      this.client = client;
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

   private onTransportStateChanged(state: ConnectionState, direction: "send" | "recv") {
      if (state === "disconnected" || state === "failed" || state === "closed") {
         this.setStatus("disconnected");
         this.emit("transport_disconnected", { direction });
      }
   }

   public checkDevice(): asserts this is this & {
      device: mediasoupClient.Device;
   } {
      if (!this.device) {
         throw new Error("Transport manager's device is not initialized");
      }
   }

   public checkTransports(): asserts this is this & {
      device: mediasoupClient.Device;
      sendTransport: Transport<MediasoupAppData>;
      recvTransport: Transport<MediasoupAppData>;
   } {
      this.checkDevice();
      if (!this.sendTransport || !this.recvTransport) {
         throw new Error("Transport manager's transports are not initialized");
      }
   }

   public async initializeDevice(rtpCapabilities: RtpCapabilities): Promise<void> {
      this.device = new mediasoupClient.Device();
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
   }

   public createSendTransport(options: TransportOptions<MediasoupAppData>): void {
      this.checkDevice();

      log("api:voice-transport", "default", "create send transport");

      const transport = this.device.createSendTransport(options);
      this.sendTransport = transport;
      this.emit("send_transport_ready", undefined);

      transport.on("connect", ({ dtlsParameters }, callback) => {
         this.emit("connect_transport", { transportId: transport.id, dtlsParameters, callback });
      });

      transport.on("produce", async ({ rtpParameters, appData }, callback) => {
         const kind = (appData as MediasoupAppData).mediaKind;

         this.emit("create_producer", { kind, transportId: transport.id, rtpParameters, callback: (id) => callback({ id }) });
      });

      transport.on("connectionstatechange", (d) => this.onTransportStateChanged(d, transport.direction));
      this.checkAndSetStatus();
   }

   public createRecvTransport(options: TransportOptions<MediasoupAppData>): void {
      this.checkDevice();

      log("api:voice-transport", "default", "create recv transport");

      const transport = this.device.createRecvTransport(options);
      this.recvTransport = transport;
      this.emit("recv_transport_ready", undefined);

      transport.on("connect", async ({ dtlsParameters }, callback) => {
         this.emit("connect_transport", { transportId: transport.id, dtlsParameters, callback });
      });

      transport.on("connectionstatechange", (d) => this.onTransportStateChanged(d, transport.direction));
      this.checkAndSetStatus();
   }

   public async createProducer(
      kind: HMediaKind,
      track: MediaStreamTrack,
      options?: { codecOptions?: ProducerCodecOptions; encodings?: RtpEncodingParameters[] },
   ): Promise<Producer<MediasoupAppData> | undefined> {
      this.checkTransports();

      log("api:voice-transport", "default", "create producer", "knd:", kind);

      if (this.producers.has(kind)) throw new Error(`Producer with kind ${kind} already exists`);

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
   }

   public async closeProducer(kind: HMediaKind): Promise<void> {
      log("api:voice-transport", "default", "close producer", "knd:", kind);

      const producer = this.producers.get(kind);
      if (!producer) throw new Error(`Producer of kind ${kind} doesn't exist`);

      await new Promise<void>((r) => {
         this.emit("close_producer", { id: producer.id, callback: r });
      });

      producer.close();
      this.producers.delete(producer.appData.mediaKind);
      this.emit("producer_closed", { producerId: producer.id, kind: producer.appData.mediaKind, userId: producer.appData.userId });
   }

   public async createConsumer(userId: Snowflake, kind: HMediaKind): Promise<void> {
      this.checkTransports();

      const remoteProducer = this.getRemoteProducers().find((x) => x.userId === userId && x.kind === kind);
      if (!remoteProducer) throw new Error(`Remote producer from user ${userId} and kind of ${kind} doesn't exist`);

      log("api:voice-transport", "default", "create consumer", "uid:", userId, "knd:", kind, "pid:", remoteProducer.producerId);

      const result = await new Promise<VoiceConsumerCreatedData>((r) => {
         this.emit("create_consumer", {
            producerId: remoteProducer.producerId,
            rtpCapabilities: this.device.rtpCapabilities,
            transportId: this.recvTransport.id,
            callback: r,
         });
      });

      const consumer = await this.recvTransport.consume({
         id: result.consumerId,
         producerId: result.producerId,
         appData: { mediaKind: result.kind, userId: result.producerUserId },
         rtpParameters: result.rtpParameters,
         kind: convertToMediaKind(result.kind),
      });

      this.consumers.set(consumer.id, consumer);

      this.emit("consumer_created", consumer);
      log("api:voice-transport", "default", "consumer created", "cid:", consumer.id, "uid:", userId, "knd:", kind, "pid:", remoteProducer.producerId);

      await new Promise<void>((r) => {
         this.emit("resume_consumer", { id: consumer.id, callback: r });
      });
   }

   public async closeConsumer(consumerId: string, skipWebsocket: boolean = false): Promise<void> {
      this.checkDevice();

      log("api:voice-transport", "default", "close consumer", "cid:", consumerId);

      const consumer = this.consumers.get(consumerId);
      if (!consumer) throw new Error(`Consumer with id ${consumerId} doesn't exist`);

      if (!skipWebsocket) {
         await new Promise<void>((r) => {
            this.emit("close_consumer", { id: consumerId, callback: r });
         });
      }

      consumer.close();
      this.consumers.delete(consumer.id);
      this.emit("consumer_closed", {
         consumerId: consumer.id,
         kind: consumer.appData.mediaKind,
         producerId: consumer.producerId,
         userId: consumer.appData.userId,
      });
      log("api:voice-transport", "default", "consumer closed", "cid:", consumerId);
   }

   public applyVoiceState(gatewayVoiceState: GatewayVoiceStateFlags, localVoiceState: LocalVoiceState): void {
      log(
         "api:voice-transport",
         "voice-state",
         "apply voice state",
         "gvs:",
         JSON.stringify(gatewayVoiceState),
         "lvs:",
         JSON.stringify(localVoiceState),
      );

      const micProducer = this.producers.get("microphone");

      if (micProducer) {
         // If state is paused, mic is not paused, pause mic
         if (localVoiceState.isAudioPaused === true && !micProducer?.paused) {
            micProducer.pause();
         }
         // If state is not paused, state is not muted, mic is paused, resume mic
         else if (localVoiceState.isAudioPaused === false && !gatewayVoiceState?.isAudioMuted && micProducer.paused) {
            micProducer.resume();
         }

         // If state is muted, mic is not paused, pause mic
         if (gatewayVoiceState.isAudioMuted === true && !micProducer.paused) {
            micProducer.pause();
         }
         // If state is not muted, state is not paused, mic is paused, resume mic
         else if (gatewayVoiceState.isAudioMuted === false && !localVoiceState.isAudioPaused && micProducer.paused) {
            micProducer.resume();
         }
      }

      for (const consumer of this.consumers.values()) {
         if (consumer.appData.mediaKind !== "stream_audio" && consumer.appData.mediaKind !== "microphone") {
            continue;
         }

         // If state is deafened consume is not paused, pause consumer
         if (gatewayVoiceState.isAudioDeafened === true && !consumer.paused) {
            consumer.pause();
         }
         // If state is not deafened, consumer is paused, resume consumer
         else if (gatewayVoiceState.isAudioDeafened === false && consumer.paused) {
            consumer.resume();
         }
      }
   }

   public async replaceProducerTrack(kind: HMediaKind, track: MediaStreamTrack): Promise<void> {
      log("api:voice-transport", "default", "replace producer track", "knd:", kind, "tid:", track.id);

      const producer = this.producers.get(kind);
      if (!producer) throw new Error(`No producer with kind ${kind} was found`);

      await producer.replaceTrack({ track });
      this.emit("producer_updated", { id: producer.id, kind: producer.appData.mediaKind, track });
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
      if (!this.recvTransport) {
         this.pendingRemoteProducers?.set(producer.producerId, producer);
         return;
      }

      this.remoteProducers.set(producer.producerId, producer);
      this.emit("remote_producer_created", producer);
   }

   public addRemoteConsumer(consumer: ConsumerData): void {
      this.remoteConsumers.set(consumer.consumerId, consumer);
      this.emit("remote_consumer_created", consumer);
   }

   public removeRemoteProducer(producerId: string): void {
      const producer = this.remoteProducers.get(producerId);
      if (!producer) return;

      this.remoteProducers.delete(producerId);
      this.emit("remote_producer_closed", producer);
   }

   public removeRemoteConsumer(consumerId: string): void {
      const consumer = this.remoteConsumers.get(consumerId);
      if (!consumer) return;

      this.remoteConsumers.delete(consumerId);
      this.emit("remote_consumer_closed", consumer);
   }

   public reset(): void {
      try {
         for (const producer of this.producers.values()) {
            producer.close();
         }

         for (const consumer of this.consumers.values()) {
            consumer.close();
         }

         this.sendTransport?.close();
         this.recvTransport?.close();
      } catch (e) {
         error("api:voice-transport", "Something went wrong trying to reset transport", e);
      } finally {
         this.device = undefined;
         this.sendTransport = undefined;
         this.recvTransport = undefined;

         this.remoteProducers.clear();
         this.remoteConsumers.clear();
         this.producers.clear();
         this.consumers.clear();

         this.setStatus("idle");
         this.emit("reset", undefined);
      }
   }
}
