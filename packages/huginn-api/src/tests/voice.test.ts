import {
   VoiceSignallingError,
   type HMediaKind,
   type MediasoupAppData,
   type VoiceCreateTransportResult,
   type VoiceCreateTransportResultData,
   type VoiceReadyData,
} from "@huginn/shared";
import { Device } from "mediasoup-client";
import * as fakeParameters from "mediasoup-client/fakeParameters";
import { FakeHandler } from "mediasoup-client/handlers/FakeHandler";
import { Transport, type Consumer, type RtpCapabilities, type RtpParameters } from "mediasoup-client/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VoiceSignalingClient } from "../voice-signaling-client";
import type { VoiceTransportManager } from "../voice-transport-manager";

import { Voice } from "../voice";
import { makeClient } from "./ws-test-utils";

vi.mock("../voice-device-manager", () => {
   class VoiceDeviceManager {
      public constructor(public transport: unknown) {}
   }

   return { VoiceDeviceManager };
});

vi.mock("../voice-stream-manager", () => {
   class VoiceStreamManager {
      public constructor(public transport: unknown) {}
   }

   return { VoiceStreamManager };
});

vi.mock("../voice-signaling-client", async () => {
   const { EventEmitter } = await import("@huginn/shared");
   class VoiceSignalingClient extends EventEmitter<Record<string, unknown>> {
      public status = "idle";

      public sendCreateTransport = vi.fn(async (direction: "send" | "recv"): Promise<VoiceCreateTransportResult> => {
         return {
            direction,
            transportId: `${direction}-transport-id`,
            params: { id: `${direction}-transport-id` } as VoiceCreateTransportResultData["params"],
         };
      });

      public sendConnectTransport = vi.fn(async (transportId: string) => ({ transportId }));
      public sendCreateProducer = vi.fn(async () => ({ producerId: "producer-id", kind: "microphone" }));
      public sendCloseProducer = vi.fn(async () => ({ producerId: "producer-id", userId: "u1", kind: "microphone" }));
      public sendCreateConsumer = vi.fn(async (producerId: string) => ({
         consumerId: "consumer-id",
         producerId,
         producerUserId: "u1",
         kind: "microphone",
         rtpParameters: {},
      }));
      public sendResumeConsumer = vi.fn(async (consumerId: string) => ({ consumerId }));
      public sendCloseConsumer = vi.fn(async (consumerId: string) => ({ consumerId, producerId: "p1", userId: "u1", kind: "microphone" }));
      public sendRestartIce = vi.fn(async () => ({ iceParameters: {} }));

      public setStatus(status: string): void {
         this.status = status;
         this.emit("status_changed", status);
      }
   }
   return { VoiceSignalingClient };
});

vi.mock("../voice-transport-manager", async () => {
   const { EventEmitter } = await import("@huginn/shared");

   class VoiceTransportManager extends EventEmitter<Record<string, unknown>> {
      public status = "idle";
      public sendTransport?: Transport<MediasoupAppData>;
      public recvTransport?: Transport;
      public remoteProducers = new Map<string, { producerId: string; userId: string; kind: string }>();
      public remoteConsumers = new Map<string, { consumerId: string; producerId: string; userId: string; kind: string }>();
      public consumers = new Map<string, Consumer>();
      private device?: Device;

      public initializeDevice = vi.fn(async (rtpCapabilities: RtpCapabilities) => {
         this.device = new Device({ handlerFactory: FakeHandler.createFactory(fakeParameters) });
         await this.device.load({ routerRtpCapabilities: rtpCapabilities });

         const { id, iceParameters, iceCandidates, dtlsParameters, sctpParameters } = fakeParameters.generateTransportRemoteParameters();
         this.sendTransport = this.device.createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters, sctpParameters });
         this.recvTransport = this.device.createRecvTransport({ id, iceParameters, iceCandidates, dtlsParameters, sctpParameters });

         this.sendTransport.on("connect", (_, callback) => setTimeout(callback));
         this.sendTransport.on("produce", (_, callback) => {
            const id = fakeParameters.generateProducerRemoteParameters().id;
            setTimeout(() => callback({ id }));
         });
         this.recvTransport.on("connect", (_, callback) => setTimeout(callback));
      });

      public createSendTransport = vi.fn(async () => undefined);
      public createRecvTransport = vi.fn(async () => undefined);

      public addRemoteProducer = vi.fn((producer: { producerId: string; userId: string; kind: string }) => {
         this.remoteProducers.set(producer.producerId, producer);
      });

      public removeRemoteProducer = vi.fn((producerId: string) => {
         this.remoteProducers.delete(producerId);
      });

      public addRemoteConsumer = vi.fn((consumer: { consumerId: string; producerId: string; userId: string; kind: string }) => {
         this.remoteConsumers.set(consumer.consumerId, consumer);
      });

      public removeRemoteConsumer = vi.fn((consumerId: string) => {
         this.remoteConsumers.delete(consumerId);
      });

      public getRemoteConsumers = vi.fn(() => Array.from(this.remoteConsumers.values()));

      public getConsumer = vi.fn((userId: string, kind: string) => {
         return Array.from(this.consumers.values()).find((x) => x.appData.userId === userId && x.appData.mediaKind === kind);
      });

      public closeConsumer = vi.fn(async (consumerId: string) => {
         this.consumers.delete(consumerId);
      });

      public getConsumers = vi.fn(() => Array.from(this.consumers.values()));

      public reset = vi.fn(() => undefined);
      public cancelRestartIce = vi.fn(() => undefined);
      public checkAndRestartIce = vi.fn(async () => undefined);

      public setStatus(status: string): void {
         this.status = status;
         this.emit("status_changed", status);
      }
   }

   return { VoiceTransportManager };
});

let voice: Voice;
let signaling: VoiceSignalingClient;
let transport: VoiceTransportManager;

beforeEach(async () => {
   vi.restoreAllMocks();
   voice = new Voice(makeClient());
   signaling = voice.signaling as VoiceSignalingClient;
   transport = voice.transport as VoiceTransportManager;
   await transport.initializeDevice(fakeParameters.generateRouterRtpCapabilities());
});

// afterEach(() => {
// });

async function createConsumer(userId: string, producerId: string, kind: HMediaKind = "microphone") {
   const consumeParams = fakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
   return await transport.recvTransport!.consume<MediasoupAppData>({ ...consumeParams, appData: { mediaKind: kind, userId }, producerId });
}

describe("connection lifecycle", () => {
   it("starts idle", () => {
      expect(voice.status).toBe("idle");
   });

   it("transitions to the appropriate status based on signaling and transport states", async () => {
      // sig idle
      signaling["setStatus"]("idle");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("idle"));

      signaling["setStatus"]("idle");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("idle");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("idle");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      // sig authenticated
      signaling["setStatus"]("authenticated");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("signaling"));

      signaling["setStatus"]("authenticated");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("authenticated");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("ready"));

      signaling["setStatus"]("authenticated");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      // sig connected
      signaling["setStatus"]("connected");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("connected");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("connected");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("connected");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      // sig connecting
      signaling["setStatus"]("connecting");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("connecting");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("connecting");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("connecting");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      // sig disconnected
      signaling["setStatus"]("disconnected");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("disconnected");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("disconnected");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("disconnected");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      // sig helloed
      signaling["setStatus"]("helloed");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("helloed");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("helloed");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("helloed");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      // sig resuming
      signaling["setStatus"]("resuming");
      transport["setStatus"]("idle");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("resuming");
      transport["setStatus"]("disconnected");
      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));

      signaling["setStatus"]("resuming");
      transport["setStatus"]("ready");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));

      signaling["setStatus"]("resuming");
      transport["setStatus"]("restarting");
      await vi.waitFor(() => expect(voice.status).toBe("connecting"));
   });

   it("transitions to ready and emits ready exactly once until a hard or session reset cycle happens", async () => {
      const onReady = vi.fn();
      voice.on("ready", onReady);

      signaling["setStatus"]("authenticated");
      transport["setStatus"]("ready");

      await vi.waitFor(() => expect(voice.status).toBe("ready"));
      expect(onReady).toHaveBeenCalledTimes(1);

      transport.emit("status_changed", "ready");
      expect(onReady).toHaveBeenCalledTimes(1);

      signaling.emit("status_changed", "authenticated");
      expect(onReady).toHaveBeenCalledTimes(1);

      signaling.emit("reset", { type: "session" });
      transport["setStatus"]("disconnected");
      transport["setStatus"]("ready");

      signaling.emit("reset", { type: "hard" });
      transport["setStatus"]("disconnected");
      transport["setStatus"]("ready");

      signaling.emit("reset", { type: "soft" });
      transport["setStatus"]("disconnected");
      transport["setStatus"]("ready");

      await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(3));
   });

   it("emits disconnected when either transport or signaling disconnects", async () => {
      const onDisconnected = vi.fn();
      voice.on("disconnected", onDisconnected);

      signaling["setStatus"]("authenticated");
      transport["setStatus"]("ready");
      transport["setStatus"]("disconnected");

      await vi.waitFor(() => expect(voice.status).toBe("disconnected"));
      expect(onDisconnected).toHaveBeenCalledTimes(1);
   });
});

describe("transport lifecycle", () => {
   it("cancels ice restart when signaling disconnects while transport is restarting", async () => {
      transport["setStatus"]("restarting");

      signaling["setStatus"]("disconnected");

      await vi.waitFor(() => expect(transport.cancelRestartIce).toHaveBeenCalledTimes(1));
   });

   it("restarts ice when signaling authenticates while transport is disconnected", async () => {
      transport["setStatus"]("disconnected");

      signaling["setStatus"]("authenticated");

      await vi.waitFor(() => expect(transport.checkAndRestartIce).toHaveBeenCalledTimes(1));
   });

   it("initializes transports and adds remote peers after signaling ready", async () => {
      const readyData = {
         rtpCapabilities: fakeParameters.generateRouterRtpCapabilities(),
         producers: [{ producerId: "p1", userId: "u2", kind: "microphone" }],
         consumers: [{ consumerId: "c1", producerId: "p1", userId: "u2", kind: "microphone" }],
      } as VoiceReadyData;

      signaling.emit("ready", readyData);

      await vi.waitFor(() => {
         expect(transport.initializeDevice).toHaveBeenCalledWith(readyData.rtpCapabilities);
         expect(signaling.sendCreateTransport).toHaveBeenCalledTimes(2);
      });
      expect(signaling.sendCreateTransport).toHaveBeenCalledWith("send");
      expect(signaling.sendCreateTransport).toHaveBeenCalledWith("recv");
      expect(transport.createSendTransport).toHaveBeenCalledWith({ id: "send-transport-id" });
      expect(transport.createRecvTransport).toHaveBeenCalledWith({ id: "recv-transport-id" });
      expect(transport.addRemoteProducer).toHaveBeenCalledWith(readyData.producers[0]);
      expect(transport.addRemoteConsumer).toHaveBeenCalledWith(readyData.consumers[0]);
   });

   it("should throw an error when send create transport returns an error", async () => {
      vi.mocked(signaling.sendCreateTransport).mockImplementation(async (direction) => {
         if (direction === "send") return { error: VoiceSignallingError.UNKNOWN_ERROR };
         else return {} as VoiceCreateTransportResult;
      });

      await expect(
         voice["handleSignalingReady"]({ rtpCapabilities: fakeParameters.generateRouterRtpCapabilities(), producers: [], consumers: [] }),
      ).rejects.toThrow();

      vi.mocked(signaling.sendCreateTransport).mockImplementation(async (direction) => {
         if (direction === "recv") return { error: VoiceSignallingError.UNKNOWN_ERROR };
         else return {} as VoiceCreateTransportResult;
      });

      await expect(
         voice["handleSignalingReady"]({ rtpCapabilities: fakeParameters.generateRouterRtpCapabilities(), producers: [], consumers: [] }),
      ).rejects.toThrow();
   });
});

describe("signaling events", () => {
   it("handles producer_closed by removing remote producer/consumer and closing local consumer", async () => {
      const remoteConsumer = await createConsumer("u3", "p1");
      const localConsumer = await createConsumer("u4", "p1");

      transport.remoteConsumers.set(remoteConsumer.id, {
         consumerId: remoteConsumer.id,
         producerId: "p1",
         userId: "u3",
         kind: "microphone",
      });
      transport.consumers.set(localConsumer.id, localConsumer);

      signaling.emit("producer_closed", { producerId: "p1", userId: "u4", kind: "microphone" });

      await vi.waitFor(() => {
         expect(transport.removeRemoteProducer).toHaveBeenCalledWith("p1");
      });
      expect(transport.removeRemoteConsumer).toHaveBeenCalledWith(remoteConsumer.id);
      expect(transport.closeConsumer).toHaveBeenCalledWith(localConsumer.id, true);
   });

   it("doesn't throw when producer_closed is received for a non-existent producer", async () => {
      expect(() => {
         signaling.emit("producer_closed", { producerId: "non-existent", userId: "u4", kind: "microphone" });
      }).not.toThrow();
   });

   it("handles peer_left by cleaning producers, consumers, and matching remote consumers", async () => {
      const consumer = await createConsumer("u9", "p1");
      const consumer2 = await createConsumer("u9", "p2");
      const consumer3 = await createConsumer("u9", "p3");
      transport.consumers.set(consumer.id, consumer);
      transport.consumers.set(consumer2.id, consumer2);
      transport.consumers.set(consumer3.id, consumer3);

      transport.remoteConsumers.set("rc1", { consumerId: "rc1", producerId: "p2", userId: "u9", kind: "camera" });
      transport.remoteConsumers.set("rc2", { consumerId: "rc2", producerId: "p9", userId: "u9", kind: "camera" });

      signaling.emit("peer_left", {
         userId: "u2",
         producerIds: ["p1", "p2"],
         consumerIds: ["server-c1"],
         sessionId: "session-id",
      });

      await vi.waitFor(() => {
         expect(transport.removeRemoteProducer).toHaveBeenCalledWith("p1");
         expect(transport.removeRemoteProducer).toHaveBeenCalledWith("p2");
      });
      expect(transport.closeConsumer).toHaveBeenCalledWith(consumer.id, true);
      expect(transport.closeConsumer).toHaveBeenCalledWith(consumer2.id, true);
      expect(transport.removeRemoteConsumer).toHaveBeenCalledWith("server-c1");
      expect(transport.removeRemoteConsumer).toHaveBeenCalledWith("rc1");
   });

   it("handles producer_created by adding remote producer", async () => {
      signaling.emit("producer_created", { producerId: "p1", userId: "u1", kind: "microphone" });

      await vi.waitFor(() => expect(transport.addRemoteProducer).toHaveBeenCalledWith({ producerId: "p1", userId: "u1", kind: "microphone" }));
   });

   it("handles consumer_created by adding remote consumer", async () => {
      signaling.emit("consumer_created", { consumerId: "c1", producerId: "p1", userId: "u1", kind: "microphone" });

      await vi.waitFor(() =>
         expect(transport.addRemoteConsumer).toHaveBeenCalledWith({ consumerId: "c1", producerId: "p1", userId: "u1", kind: "microphone" }),
      );
   });

   it("handles consumer_closed by removing remote consumer", async () => {
      signaling.emit("consumer_closed", { consumerId: "c1", producerId: "p1", userId: "u1", kind: "microphone" });

      await vi.waitFor(() => expect(transport.removeRemoteConsumer).toHaveBeenCalledWith("c1"));
   });
});

describe("transport events", () => {
   it("handles connect_transport by proxying through signaling and invoking callback", async () => {
      const callback = vi.fn();

      const dtlsParameters = fakeParameters.generateLocalDtlsParameters();
      transport.emit("connect_transport", {
         transportId: "send-transport-id",
         dtlsParameters,
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendConnectTransport).toHaveBeenCalledWith("send-transport-id", dtlsParameters));
      expect(callback).toHaveBeenCalledWith({ transportId: "send-transport-id" });
   });

   it("handles create_producer by proxying to signaling and invoking callback", async () => {
      const callback = vi.fn();

      const rtpParameters: RtpParameters = { codecs: [] };
      transport.emit("create_producer", {
         kind: "microphone",
         transportId: "send-transport-id",
         rtpParameters,
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendCreateProducer).toHaveBeenCalledWith("microphone", "send-transport-id", rtpParameters));
      expect(callback).toHaveBeenCalledWith({ producerId: "producer-id", kind: "microphone" });
   });

   it("handles close_producer by proxying to signaling and invoking callback", async () => {
      const callback = vi.fn();

      transport.emit("close_producer", {
         id: "producer-id",
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendCloseProducer).toHaveBeenCalledWith("producer-id"));
      expect(callback).toHaveBeenCalledWith({ producerId: "producer-id", userId: "u1", kind: "microphone" });
   });

   it("handles create_consumer by proxying to signaling and invoking callback", async () => {
      const callback = vi.fn();

      transport.emit("create_consumer", {
         producerId: "p1",
         transportId: "recv-transport-id",
         rtpCapabilities: {},
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendCreateConsumer).toHaveBeenCalledWith("p1", "recv-transport-id", {}));
      expect(callback).toHaveBeenCalledWith({ producerId: "p1", producerUserId: "u1", consumerId: "consumer-id", kind: "microphone", rtpParameters: {} });
   });

   it("handles resume_consumer by proxying to signaling and invoking callback", async () => {
      const callback = vi.fn();

      transport.emit("resume_consumer", {
         id: "consumer-id",
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendResumeConsumer).toHaveBeenCalledWith("consumer-id"));
      expect(callback).toHaveBeenCalledWith({ consumerId: "consumer-id" });
   });

   it("handles close_consumer by proxying to signaling and invoking callback", async () => {
      const callback = vi.fn();

      transport.emit("close_consumer", {
         id: "consumer-id",
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendCloseConsumer).toHaveBeenCalledWith("consumer-id"));
      expect(callback).toHaveBeenCalledWith({ consumerId: "consumer-id", kind: "microphone", producerId: "p1", userId: "u1" });
   });

   it("handles restart_ice by proxying to signaling and invoking callback", async () => {
      const callback = vi.fn();

      transport.emit("restart_ice", {
         transportId: "send-transport-id",
         callback,
      });

      await vi.waitFor(() => expect(signaling.sendRestartIce).toHaveBeenCalledWith("send-transport-id"));
      expect(callback).toHaveBeenCalledWith({ iceParameters: {} });
   });
});
