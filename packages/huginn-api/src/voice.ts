import type { HuginnClient, VoiceOptions, VoiceStatus } from ".";
import { defaultClientOptions } from "./utils";
import { VoiceSignalingClient } from "./voice-signaling-client";
import { VoiceTransportManager } from "./voice-transport-manager";
import { EventEmitter } from "./event-emitter";
import { VoiceDeviceManager } from "./voice-device-manager";
import { VoiceStreamManager } from "./voice-stream-manager";
import { log } from "@huginn/shared";

type Events = {
   status_changed: VoiceStatus;
   ready: undefined;
   disconnected: undefined;
   reset: undefined;
};

export class Voice extends EventEmitter<Events> {
   public client: HuginnClient;
   public signaling: VoiceSignalingClient;
   public transport: VoiceTransportManager;
   public device: VoiceDeviceManager;
   public stream: VoiceStreamManager;

   private options: VoiceOptions;

   private _status: VoiceStatus = "idle";
   public get status(): VoiceStatus {
      return this._status;
   }

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      super();
      this.options = { ...defaultClientOptions.voice, ...options };
      this.client = client;

      this.signaling = new VoiceSignalingClient(client, this.options);
      this.transport = new VoiceTransportManager(client);
      this.device = new VoiceDeviceManager(this.transport);
      this.stream = new VoiceStreamManager(this.transport);

      this.listenSignalingEvents();
      this.listenTransportEvents();
   }

   private listenSignalingEvents() {
      this.signaling.on("status_changed", () => this.recalculateStatus());

      this.signaling.on("reset", () => {
         this.transport.reset();
         this.emit("reset", undefined);
      });

      this.signaling.on("ready", async (d) => {
         await this.transport.initializeDevice(d.rtpCapabilities);
         this.signaling.sendCreateSendTransport();
         this.signaling.sendCreateRecvTransport();

         for (const producer of d.producers) {
            this.transport.addRemoteProducer(producer);
         }
      });

      this.signaling.on("new_producer", (d) => {
         this.transport.addRemoteProducer(d);
      });

      this.signaling.on("new_consumer", (d) => {
         this.transport.addRemoteConsumer(d);
      });

      this.signaling.on("transport_created", (d) => {
         if (d.direction === "send") {
            this.transport.createSendTransport(d.params);
         } else if (d.direction === "recv") {
            this.transport.createRecvTransport(d.params);
         }
      });

      this.signaling.on("producer_closed", async (d) => {
         this.transport.removeRemoteProducer(d.producerId);

         // Remove any remote consumers that are consuming this producer
         const remoteConsumerId = this.transport.getRemoteConsumers().find((x) => x.producerId === d.producerId)?.consumerId;
         if (remoteConsumerId) {
            this.transport.removeRemoteConsumer(remoteConsumerId);
         }

         const consumer = this.transport.getConsumer(d.userId, d.kind);
         if (consumer) {
            await this.transport.closeConsumer(consumer.id, true);
         }
      });

      this.signaling.on("consumer_closed", (d) => {
         this.transport.removeRemoteConsumer(d.consumerId);
      });

      this.signaling.on("peer_left", async (d) => {
         for (const producerId of d.producerIds) {
            this.transport.removeRemoteProducer(producerId);

            const consumers = this.transport.getConsumers().filter((x) => x.producerId === producerId);
            for (const consumer of consumers) {
               await this.transport.closeConsumer(consumer.id, true);
            }
         }

         // Remove the user's consumers
         for (const consumerId of d.consumerIds) {
            this.transport.removeRemoteConsumer(consumerId);
         }

         // Remove remote consumers of the left peer's producers
         for (const consumer of this.transport.remoteConsumers.values()) {
            if (d.producerIds.includes(consumer.producerId)) {
               this.transport.removeRemoteConsumer(consumer.consumerId);
            }
         }
      });
   }

   private listenTransportEvents() {
      this.transport.on("status_changed", () => this.recalculateStatus());

      this.transport.on("connect_transport", async (d) => {
         await this.signaling.sendConnectTransport(d.transportId, d.dtlsParameters);
         d.callback();
      });

      this.transport.on("create_producer", async (d) => {
         const id = await this.signaling.sendCreateProducer(d.kind, d.transportId, d.rtpParameters);
         d.callback(id);
      });

      this.transport.on("close_producer", async (d) => {
         await this.signaling.sendCloseProducer(d.id);
         d.callback();
      });

      this.transport.on("create_consumer", async (d) => {
         const result = await this.signaling.sendCreateConsumer(d.producerId, d.transportId, d.rtpCapabilities);
         d.callback(result);
      });

      this.transport.on("resume_consumer", async (d) => {
         await this.signaling.sendResumeConsumer(d.id);
         d.callback();
      });

      this.transport.on("close_consumer", async (d) => {
         await this.signaling.sendCloseConsumer(d.id);
         d.callback();
      });

      this.transport.on("transport_disconnected", async () => {
         log("api:voice", "default", "transport disconnected");
         this.signaling.checkStatus();
         const connectionData = { ...this.signaling.connectionData };
         this.signaling.hardReset();
         await this.client.voiceManager.connectVoice(connectionData.guildId ?? null, connectionData.channelId, connectionData.token);
         log("api:voice", "default", "voice recovery successful");
      });
   }

   private recalculateStatus() {
      const transportStatus = this.transport.status;
      const signalingStatus = this.signaling.status;

      let finalStatus: VoiceStatus;

      if (signalingStatus === "idle" && transportStatus === "idle") {
         finalStatus = "idle";
      } else if (signalingStatus === "disconnected" || transportStatus === "disconnected") {
         finalStatus = "disconnected";
      } else if (signalingStatus !== "authenticated") {
         finalStatus = "connecting";
      } else if (transportStatus !== "ready") {
         finalStatus = "signaling";
      } else if (signalingStatus === "authenticated" && transportStatus === "ready") {
         finalStatus = "ready";
      } else {
         finalStatus = "idle";
      }

      console.log(transportStatus, signalingStatus, finalStatus);

      if (finalStatus !== this._status) {
         this.setStatus(finalStatus);
      }
   }

   private setStatus(newStatus: VoiceStatus) {
      this._status = newStatus;
      this.emit("status_changed", newStatus);

      switch (newStatus) {
         // case "idle":
         // case "signaling":
         case "ready":
            this.emit("ready", undefined);
            break;
         case "disconnected":
            this.emit("disconnected", undefined);
            break;
      }
   }
}
