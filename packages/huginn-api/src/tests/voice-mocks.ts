import { EventEmitter } from "@huginnjs/shared";
import { Device, FakeHandler, testFakeParameters } from "mediasoup-client";
import { type Producer, type Consumer, type RtpCapabilities, type Transport } from "mediasoup-client/types";
import { vi, type Mock } from "vitest";

export class VoiceTransportManager extends EventEmitter<Record<string, unknown>> {
   public status = "idle";
   public sendTransport?: Transport;
   public recvTransport?: Transport;
   public remoteProducers: Map<string, { producerId: string; userId: string; kind: string }> = new Map();
   public remoteConsumers: Map<string, { consumerId: string; producerId: string; userId: string; kind: string }> = new Map();
   public consumers: Map<string, Consumer> = new Map();
   public producers: Map<string, Producer> = new Map();
   private device?: Device;

   public initializeDevice: Mock = vi.fn(async (rtpCapabilities: RtpCapabilities) => {
      this.device = new Device({ handlerFactory: FakeHandler.createFactory(testFakeParameters) });
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });

      const { id, iceParameters, iceCandidates, dtlsParameters, sctpParameters } = testFakeParameters.generateTransportRemoteParameters();
      this.sendTransport = this.device.createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters, sctpParameters });
      this.recvTransport = this.device.createRecvTransport({ id, iceParameters, iceCandidates, dtlsParameters, sctpParameters });

      this.sendTransport.on("connect", (_, callback) => setTimeout(callback));
      this.sendTransport.on("produce", (_, callback) => {
         const id = testFakeParameters.generateProducerRemoteParameters().id;
         setTimeout(() => callback({ id }));
      });
      this.recvTransport.on("connect", (_, callback) => setTimeout(callback));
   });

   public createSendTransport: Mock = vi.fn(async () => undefined);
   public createRecvTransport: Mock = vi.fn(async () => undefined);

   public addRemoteProducer: Mock = vi.fn((producer: { producerId: string; userId: string; kind: string }) => {
      this.remoteProducers.set(producer.producerId, producer);
   });

   public removeRemoteProducer: Mock = vi.fn((producerId: string) => {
      this.remoteProducers.delete(producerId);
   });

   public addRemoteConsumer: Mock = vi.fn((consumer: { consumerId: string; producerId: string; userId: string; kind: string }) => {
      this.remoteConsumers.set(consumer.consumerId, consumer);
   });

   public removeRemoteConsumer: Mock = vi.fn((consumerId: string) => {
      this.remoteConsumers.delete(consumerId);
   });

   public getRemoteConsumers: Mock = vi.fn(() => Array.from(this.remoteConsumers.values()));

   public getConsumer: Mock = vi.fn((userId: string, kind: string) => {
      return Array.from(this.consumers.values()).find((x) => x.appData.userId === userId && x.appData.mediaKind === kind);
   });

   public closeConsumer: Mock = vi.fn(async (consumerId: string) => {
      this.consumers.delete(consumerId);
   });

   public createProducer: Mock = vi.fn(async () => undefined);
   public closeProducer: Mock = vi.fn(async (kind: string) => this.producers.delete(kind));

   public getConsumers: Mock = vi.fn(() => Array.from(this.consumers.values()));

   public getProducer: Mock = vi.fn((kind: string) => this.producers.get(kind));
   public replaceProducerTrack: Mock = vi.fn(async () => undefined);

   public reset: Mock = vi.fn(() => undefined);
   public cancelRestartIce: Mock = vi.fn(() => undefined);
   public checkAndRestartIce: Mock = vi.fn(async () => undefined);

   public setStatus(status: string): void {
      this.status = status;
      this.emit("status_changed", status);
   }
}
