import { analytics, EventEmitter, recordSpanError } from "@huginn/shared";

import type { HuginnClient, VoiceOptions, VoiceStatus } from ".";

import { defaultClientOptions } from "./utils";
import { VoiceDeviceManager } from "./voice-device-manager";
import { VoiceSignalingClient } from "./voice-signaling-client";
import { VoiceStreamManager } from "./voice-stream-manager";
import { VoiceTransportManager } from "./voice-transport-manager";

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
   private wasReady = false;

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

   private getDefaultAttributes() {
      return {
         "voice.user.id": this.client.currentUser?.id ?? "null",
         "voice.status": this.status,
         "voice.signaling.status": this.signaling.status,
         "voice.transport.status": this.transport.status,
      };
   }

   private listenSignalingEvents() {
      this.signaling.on("status_changed", async (d) => {
         return await analytics.startActiveSpan("apiVoice.signalingStatusChanged", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.status": d,
            });

            try {
               this.recalculateStatus();

               // If transport is restarting ice and voice gets disconnected, cancel ice restart and it should be restarted again when voice gets connected again
               if (d === "disconnected" && this.transport.status === "restarting") {
                  this.transport.cancelRestartIce();
               }

               if (d === "authenticated" && this.transport.status === "disconnected") {
                  await this.transport.checkAndRestartIce();
               }
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.signaling.on("reset", ({ type }) => {
         if (type === "hard" || type === "session") {
            this.transport.reset();
            this.emit("reset", undefined);
            this.wasReady = false;
         }
      });

      this.signaling.on("ready", async (d) => {
         return await analytics.startActiveSpan("apiVoice.signalingReady", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.producer_count": d.producers.length,
               "params.consumer_count": d.consumers.length,
            });

            try {
               await this.transport.initializeDevice(d.rtpCapabilities);
               const sendResult = await this.signaling.sendCreateTransport("send");
               const recvResult = await this.signaling.sendCreateTransport("recv");

               if ("error" in sendResult) {
                  throw new Error(`Creating send transport failed: ${sendResult.error}`);
               }

               if ("error" in recvResult) {
                  throw new Error(`Creating receive transport failed: ${recvResult.error}`);
               }

               await this.transport.createSendTransport(sendResult.params);
               await this.transport.createRecvTransport(recvResult.params);

               for (const producer of d.producers) {
                  this.transport.addRemoteProducer(producer);
               }

               for (const consumer of d.consumers) {
                  this.transport.addRemoteConsumer(consumer);
               }
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.signaling.on("producer_created", (d) => {
         this.transport.addRemoteProducer(d);
      });

      this.signaling.on("consumer_created", (d) => {
         this.transport.addRemoteConsumer(d);
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
         return await analytics.startActiveSpan("apiVoice.signalingPeerLeft", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.user_id": d.userId,
               "params.producer_count": d.producerIds.length,
               "params.consumer_count": d.consumerIds.length,
            });

            try {
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
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });
   }

   private listenTransportEvents() {
      this.transport.on("status_changed", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportStatusChanged", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.status": d,
            });

            try {
               this.recalculateStatus();

               if (this.signaling.status === "authenticated" && d === "disconnected") {
                  await this.transport.checkAndRestartIce();
               }
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("connect_transport", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportConnect", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.transport_id": d.transportId,
            });

            try {
               const result = await this.signaling.sendConnectTransport(d.transportId, d.dtlsParameters);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("create_producer", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportCreateProducer", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.media_kind": d.kind,
               "params.transport_id": d.transportId,
            });

            try {
               const result = await this.signaling.sendCreateProducer(d.kind, d.transportId, d.rtpParameters);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("close_producer", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportCloseProducer", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.producer_id": d.id,
            });

            try {
               const result = await this.signaling.sendCloseProducer(d.id);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("create_consumer", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportCreateConsumer", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.producer_id": d.producerId,
               "params.transport_id": d.transportId,
            });

            try {
               const result = await this.signaling.sendCreateConsumer(d.producerId, d.transportId, d.rtpCapabilities);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("resume_consumer", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportResumeConsumer", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.consumer_id": d.id,
            });

            try {
               const result = await this.signaling.sendResumeConsumer(d.id);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("close_consumer", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportCloseConsumer", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.consumer_id": d.id,
            });

            try {
               const result = await this.signaling.sendCloseConsumer(d.id);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
      });

      this.transport.on("restart_ice", async (d) => {
         return await analytics.startActiveSpan("apiVoice.transportRestartIce", async (span) => {
            span.setAttributes({
               ...this.getDefaultAttributes(),
               "params.transport_id": d.transportId,
            });

            try {
               const result = await this.signaling.sendRestartIce(d.transportId);
               d.callback(result);
            } catch (e) {
               recordSpanError(e);
               throw e;
            } finally {
               span.end();
            }
         });
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

      if (finalStatus !== this._status) {
         this.setStatus(finalStatus);
      }
   }

   private setStatus(newStatus: VoiceStatus) {
      analytics.startActiveSpan("apiVoice.setStatus", (span) => {
         span.setAttributes({ ...this.getDefaultAttributes(), "voice.new_status": newStatus, "voice.old_status": this._status });
         this._status = newStatus;
         this.emit("status_changed", newStatus);

         switch (newStatus) {
            // case "idle":
            // case "signaling":
            case "ready":
               if (!this.wasReady) {
                  this.emit("ready", undefined);
                  this.wasReady = true;
               }
               break;
            case "disconnected":
               this.emit("disconnected", undefined);
               break;
         }

         span.end();
      });
   }
}
