import type { Consumer, TransportOptions } from "mediasoup-client/types";

import { VoiceSignallingError, type HMediaKind } from "@huginnjs/shared";
import { FakeMediaStreamTrack } from "fake-mediastreamtrack";
import { FakeHandler, testFakeParameters } from "mediasoup-client";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceTransportManager } from "../voice-transport-manager";
import { makeClient } from "./test-utils";

// ---------------------------------------------------------------------------
// Real-device helpers
// ---------------------------------------------------------------------------

function fakeRouterRtpCapabilities() {
   return testFakeParameters.generateRouterRtpCapabilities();
}

function fakeTransportOptions(): TransportOptions {
   return testFakeParameters.generateTransportRemoteParameters();
}

function makeTrack(id = "track-1"): MediaStreamTrack {
   return new FakeMediaStreamTrack({ kind: "audio", id });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const TURN_ID = "test-turn-id";
const TURN_TOKEN = "test-turn-token";

// Stub the env vars used inside fetchTurnCredentials
vi.stubEnv("VITE_PUBLIC_CLOUDFLARE_TURN_ID", TURN_ID);
vi.stubEnv("VITE_PUBLIC_CLOUDFLARE_TURN_TOKEN", TURN_TOKEN);
const ICE_SERVERS_URL = `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_ID}/credentials/generate-ice-servers`;
const server = setupServer();

let transport: VoiceTransportManager;

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

beforeEach(() => {
   server.use(
      http.post(ICE_SERVERS_URL, () => {
         return HttpResponse.json({ iceServers: [{ urls: ["turn:turn.cloudflare.com:3478"] }] });
      }),
   );

   vi.restoreAllMocks();

   const client = makeClient("test-token");

   // Inject the FakeHandler-backed Device factory. Replace this with whatever
   // seam VoiceTransportManager ends up exposing.
   transport = new VoiceTransportManager(client, {
      deviceOptions: {
         handlerFactory: FakeHandler.createFactory(testFakeParameters),
      },
   });
});

afterEach(() => {
   server.resetHandlers();
});

async function createReadyTransports(): Promise<void> {
   await transport.initializeDevice(fakeRouterRtpCapabilities());
   await transport.createSendTransport(fakeTransportOptions());
   await transport.createRecvTransport(fakeTransportOptions());
}

describe("device and transport guards", () => {
   it("checkDevice throws when no device has been initialized", () => {
      expect(() => transport.checkDevice()).toThrow();
   });

   it("checkSendTransport throws when the device exists but the send transport does not", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      expect(() => transport.checkSendTransport()).toThrow();
   });

   it("checkRecvTransport throws when the device exists but the recv transport does not", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      expect(() => transport.checkRecvTransport()).toThrow();
   });

   it("checkSendTransport passes once device and send transport exist", async () => {
      await createReadyTransports();
      expect(() => transport.checkSendTransport()).not.toThrow();
   });

   it("checkRecvTransport passes once device and recv transport exist", async () => {
      await createReadyTransports();
      expect(() => transport.checkRecvTransport()).not.toThrow();
   });
});

describe("initializeDevice()", () => {
   it("creates and loads a real mediasoup Device", async () => {
      expect(transport.device).toBeUndefined();
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      expect(transport.device).toBeDefined();
      expect(transport.device!.loaded).toBe(true);
   });

   it("throws when called with bad routerRtpCapabilities", async () => {
      await expect(transport.initializeDevice(undefined as any)).rejects.toThrow();
   });
});

describe("createSendTransport()", () => {
   it("throws when the device has not been initialized", async () => {
      await expect(transport.createSendTransport(fakeTransportOptions())).rejects.toThrow();
   });

   it("creates the transport, stores it, and emits send_transport_ready", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      const readyHandler = vi.fn();
      transport.on("send_transport_ready", readyHandler);

      await transport.createSendTransport(fakeTransportOptions());

      expect(transport.sendTransport).toBeDefined();
      expect(readyHandler).toHaveBeenCalledTimes(1);
   });

   it("forwards transport 'connect' events and resolves the callback on success", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      await transport.createSendTransport(fakeTransportOptions());

      const connectHandler = vi.fn((payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("connect_transport", connectHandler);

      // Real transport: calling produce() is what triggers the transport's
      // first "connect" event under the hood via FakeHandler, exactly like a
      // real browser handler would on first send. We don't manually .trigger()
      // anything here — the library drives its own event.
      const track = makeTrack();
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));
      await transport.createProducer("microphone", track);

      expect(connectHandler).toHaveBeenCalledWith(expect.objectContaining({ transportId: transport.sendTransport!.id, dtlsParameters: expect.anything() }));
   });

   it("forwards transport 'connect' events and rejects via errback on error", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      await transport.createSendTransport(fakeTransportOptions());

      transport.on("connect_transport", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      const track = makeTrack();
      await expect(transport.createProducer("microphone", track)).rejects.toThrow();
   });

   it("forwards transport 'produce' events and resolves with the produced id", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      await transport.createSendTransport(fakeTransportOptions());

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));

      const created = vi.fn();
      transport.on("producer_created", created);

      const producer = await transport.createProducer("microphone", makeTrack());

      expect(producer?.id).toBe("producer-1");
      expect(created).toHaveBeenCalledWith(producer);
   });

   it("forwards transport 'produce' events and rejects via errback on error", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      await transport.createSendTransport(fakeTransportOptions());

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      await expect(transport.createProducer("microphone", makeTrack())).rejects.toThrow();
   });

   it("reacts to connectionstatechange by marking the manager disconnected", async () => {
      await createReadyTransports();
      expect(transport.status).toBe("ready");

      const statusChanged = vi.fn();
      transport.on("status_changed", statusChanged);

      transport.sendTransport?.handler.emit("@connectionstatechange", "failed");

      expect(transport.status).toBe("disconnected");
      expect(statusChanged).toHaveBeenCalledWith("disconnected");
   });

   it("fetches turn server credentials when the send transport is created", async () => {
      server.use(
         http.post(ICE_SERVERS_URL, () => {
            return HttpResponse.json({ iceServers: [{ urls: ["turn:turn.cloudflare.com:3478"] }] });
         }),
      );

      await transport.initializeDevice(fakeRouterRtpCapabilities());
      const spy = vi.spyOn(transport.device!, "createSendTransport");

      const options = fakeTransportOptions();
      await transport.createSendTransport(options);

      expect(spy).toHaveBeenCalledWith({ ...options, iceServers: [{ urls: ["turn:turn.cloudflare.com:3478"] }] });
   });

   it("still creates send transport when fetching turn credentials fails", async () => {
      server.use(
         http.post(ICE_SERVERS_URL, () => {
            return new HttpResponse(null, { status: 404 });
         }),
      );

      await transport.initializeDevice(fakeRouterRtpCapabilities());
      const spy = vi.spyOn(transport.device!, "createSendTransport");

      const options = fakeTransportOptions();
      await transport.createSendTransport(options);

      expect(spy).toHaveBeenCalledWith({ ...options, iceServers: undefined });
   });
});

describe("createRecvTransport()", () => {
   it("throws when the device has not been initialized", async () => {
      await expect(transport.createRecvTransport(fakeTransportOptions())).rejects.toThrow();
   });

   it("creates the transport, stores it, and emits recv_transport_ready", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      const readyHandler = vi.fn();
      transport.on("recv_transport_ready", readyHandler);

      await transport.createRecvTransport(fakeTransportOptions());

      expect(transport.recvTransport).toBeDefined();
      expect(readyHandler).toHaveBeenCalledTimes(1);
   });

   it("forwards transport 'connect' events and rejects via errback on error", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      await transport.createRecvTransport(fakeTransportOptions());
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: "remote-producer-1",
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );

      await expect(transport.createConsumer("user-2", "microphone")).rejects.toThrow();
   });

   it("forwards transport 'connect' events and resolves the callback on success", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));

      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: "remote-producer-1",
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      // consume() is what drives the recv transport's first real "connect" event.
      await expect(transport.createConsumer("user-2", "microphone")).resolves.toBeDefined();
   });

   it("fetches turn server credentials when the recv transport is created", async () => {
      server.use(
         http.post(ICE_SERVERS_URL, () => {
            return HttpResponse.json({ iceServers: [{ urls: ["turn:turn.cloudflare.com:3478"] }] });
         }),
      );

      await transport.initializeDevice(fakeRouterRtpCapabilities());
      const spy = vi.spyOn(transport.device!, "createRecvTransport");

      const options = fakeTransportOptions();
      await transport.createRecvTransport(options);

      expect(spy).toHaveBeenCalledWith({ ...options, iceServers: [{ urls: ["turn:turn.cloudflare.com:3478"] }] });
   });

   it("still creates recv transport when fetching turn credentials fails", async () => {
      server.use(
         http.post(ICE_SERVERS_URL, () => {
            return new HttpResponse(null, { status: 404 });
         }),
      );

      await transport.initializeDevice(fakeRouterRtpCapabilities());
      const spy = vi.spyOn(transport.device!, "createRecvTransport");

      const options = fakeTransportOptions();
      await transport.createRecvTransport(options);

      expect(spy).toHaveBeenCalledWith({ ...options, iceServers: undefined });
   });
});

describe("status transitions", () => {
   it("becomes ready once both transports exist in a connected-compatible state", async () => {
      const statusChanged = vi.fn();
      transport.on("status_changed", statusChanged);

      await createReadyTransports();

      expect(transport.status).toBe("ready");
      expect(statusChanged).toHaveBeenCalledWith("ready");
   });

   it("flushes pending remote producers once the manager becomes ready", async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
      await transport.createSendTransport(fakeTransportOptions());

      // No recvTransport yet, so this goes into the pending queue.
      const remoteProducerCreated = vi.fn();
      transport.on("remote_producer_created", remoteProducerCreated);

      transport.addRemoteProducer({ producerId: "remote-1", userId: "user-2", kind: "microphone" });
      expect(transport.getRemoteProducers()).toHaveLength(0);
      expect(remoteProducerCreated).not.toHaveBeenCalled();

      await transport.createRecvTransport(fakeTransportOptions());

      expect(transport.getRemoteProducers()).toHaveLength(1);
      expect(remoteProducerCreated).toHaveBeenCalledWith(expect.objectContaining({ producerId: "remote-1" }));
   });

   it("cancelRestartIce forces the manager into a disconnected state", async () => {
      await createReadyTransports();
      transport.cancelRestartIce();
      expect(transport.status).toBe("disconnected");
   });
});

describe("checkAndRestartIce()", () => {
   it("throws if transports are not initialized", async () => {
      await expect(transport.checkAndRestartIce()).rejects.toThrow();
   });

   it("does nothing when both transports are healthy", async () => {
      await createReadyTransports();
      const restartHandler = vi.fn();
      transport.on("restart_ice", restartHandler);

      await transport.checkAndRestartIce();

      expect(restartHandler).not.toHaveBeenCalled();
   });

   it("restarts ice on both transports when either is disconnected or failed", async () => {
      await createReadyTransports();
      transport.sendTransport?.handler.emit("@connectionstatechange", "failed");
      expect(transport.status).toBe("disconnected");

      let restartCalls = 0;
      transport.on("restart_ice", (payload) => {
         restartCalls++;
         const params = testFakeParameters.generateTransportRemoteParameters();
         payload.callback({ iceParameters: params.iceParameters }); // has iceParameters
      });

      await transport.checkAndRestartIce();

      expect(restartCalls).toBe(2);
   });
});

describe("restartIce()", () => {
   it("throws if transports are not initialized", async () => {
      await expect(transport.restartIce("send")).rejects.toThrow();
   });

   it("skips restarting if the manager is already ready", async () => {
      await createReadyTransports();

      const restartHandler = vi.fn();
      transport.on("restart_ice", restartHandler);

      await transport.restartIce("send");

      expect(restartHandler).not.toHaveBeenCalled();
      expect(transport.status).toBe("ready");
   });

   it("sets status to restarting, requests new ice parameters, and applies them", async () => {
      await createReadyTransports();
      transport.sendTransport?.handler.emit("@connectionstatechange", "disconnected");

      const statuses: string[] = [];
      transport.on("status_changed", (s) => statuses.push(s));

      transport.on("restart_ice", (payload) => {
         expect(payload.transportId).toBe(transport.sendTransport!.id);
         payload.callback({ iceParameters: testFakeParameters.generateTransportRemoteParameters().iceParameters });
      });

      await transport.restartIce("send");

      expect(statuses).toContain("restarting");
   });

   it("throws when the server reports an error while restarting ice", async () => {
      await createReadyTransports();
      transport.sendTransport?.handler.emit("@connectionstatechange", "disconnected");

      transport.on("restart_ice", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      await expect(transport.restartIce("send")).rejects.toThrow();
   });
});

describe("createProducer()", () => {
   it("throws when transports are not initialized", async () => {
      await expect(transport.createProducer("microphone", makeTrack())).rejects.toThrow();
   });

   it("throws when a producer of that kind already exists", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));

      await transport.createProducer("microphone", makeTrack());
      await expect(transport.createProducer("microphone", makeTrack("track-2"))).rejects.toThrow();
   });

   it("produces on the send transport, stores the producer, and emits producer_created", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));

      const created = vi.fn();
      transport.on("producer_created", created);

      const track = makeTrack();
      const result = await transport.createProducer("microphone", track);

      expect(result?.id).toBe("producer-1");
      expect(transport.getProducer("microphone")).toBe(result);
      expect(created).toHaveBeenCalledWith(result);
      expect(result?.track).toBe(track);
   });

   it("closes the producer automatically once its track ends", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));
      transport.on("close_producer", (payload) => payload.callback({ producerId: payload.id, kind: "microphone", userId: "user-me" }));

      const track = makeTrack();
      await transport.createProducer("microphone", track);
      expect(transport.getProducer("microphone")).toBeDefined();

      track.onended?.(new Event("ended"));
      await vi.waitFor(() => expect(transport.getProducer("microphone")).toBeUndefined());
   });
});

describe("closeProducer()", () => {
   it("throws when no producer of that kind exists", async () => {
      await expect(transport.closeProducer("microphone")).rejects.toThrow();
   });

   it("emits close_producer, closes it, removes it, and emits producer_closed on success", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));

      const producer = await transport.createProducer("microphone", makeTrack());
      expect(producer).toBeDefined();

      transport.on("close_producer", (payload) => {
         expect(payload.id).toBe(producer!.id);
         payload.callback({ producerId: producer!.id, kind: "microphone", userId: "user-me" });
      });

      const closed = vi.fn();
      transport.on("producer_closed", closed);

      await transport.closeProducer("microphone");

      expect(producer!.closed).toBe(true);
      expect(transport.getProducer("microphone")).toBeUndefined();
      expect(closed).toHaveBeenCalledWith({ producerId: producer!.id, kind: "microphone", userId: "user-me" });
   });

   it("throws and keeps the producer when the server reports an error", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));

      const producer = await transport.createProducer("microphone", makeTrack());
      expect(producer).toBeDefined();

      transport.offAll("close_producer");
      transport.on("close_producer", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      await expect(transport.closeProducer("microphone")).rejects.toThrow();
      expect(producer!.closed).toBe(false);
      expect(transport.getProducer("microphone")).toBe(producer);
   });
});

describe("createConsumer()", () => {
   it("throws when transports are not initialized", async () => {
      await expect(transport.createConsumer("user-2", "microphone")).rejects.toThrow();
   });

   it("throws when there is no matching remote producer", async () => {
      await createReadyTransports();
      await expect(transport.createConsumer("user-2", "microphone")).rejects.toThrow();
   });

   it("creates, stores, and resumes the consumer on success", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: "remote-producer-1",
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );

      let resumeRequested = false;
      transport.on("resume_consumer", (payload) => {
         resumeRequested = true;
         payload.callback({ consumerId: payload.id });
      });

      const created = vi.fn();
      transport.on("consumer_created", created);

      const result: Consumer = await transport.createConsumer("user-2", "microphone");

      expect(resumeRequested).toBe(true);
      expect(created).toHaveBeenCalledWith(result);
      expect(transport.getConsumers()).toContain(result);
   });

   it("throws when the server reports an error creating the consumer", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("create_consumer", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      await expect(transport.createConsumer("user-2", "microphone")).rejects.toThrow();
   });

   it("closes the consumer and throws if the remote producer disappeared mid-flight", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) => {
         // Simulate the producer being removed while consume() is in flight.
         transport.removeRemoteProducer(payload.producerId);
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: "remote-producer-1",
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         });
      });

      await expect(transport.createConsumer("user-2", "microphone")).rejects.toThrow();
      expect(transport.getConsumers()).toHaveLength(0);
   });

   it("throws when the server reports an error resuming the consumer", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: "remote-producer-1",
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      await expect(transport.createConsumer("user-2", "microphone")).rejects.toThrow();
   });
});

describe("closeConsumer()", () => {
   beforeEach(async () => {
      await transport.initializeDevice(fakeRouterRtpCapabilities());
   });

   it("throws when no consumer with that id exists", async () => {
      await expect(transport.closeConsumer("missing-consumer")).rejects.toThrow();
   });

   it("signals the server, closes the consumer, and emits consumer_closed", async () => {
      await transport.createSendTransport(fakeTransportOptions());
      await transport.createRecvTransport(fakeTransportOptions());
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: "remote-producer-1",
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      const consumer = await transport.createConsumer("user-2", "microphone");

      transport.offAll("close_consumer");
      transport.on("close_consumer", (payload) => {
         expect(payload.id).toBe(consumer.id);
         payload.callback({ consumerId: consumer.id, kind: "microphone", producerId: consumer.producerId, userId: "user-2" });
      });

      const closed = vi.fn();
      transport.on("consumer_closed", closed);

      await transport.closeConsumer(consumer.id);

      expect(consumer.closed).toBe(true);
      expect(transport.consumers.has(consumer.id)).toBe(false);
      expect(closed).toHaveBeenCalledWith({
         consumerId: consumer.id,
         kind: "microphone",
         producerId: consumer.producerId,
         userId: "user-2",
      });
   });

   it("throws and keeps the consumer when the server reports an error", async () => {
      await transport.createSendTransport(fakeTransportOptions());
      await transport.createRecvTransport(fakeTransportOptions());
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: params.producerId,
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      const consumer = await transport.createConsumer("user-2", "microphone");

      transport.offAll("close_consumer");
      transport.on("close_consumer", (payload) => payload.callback({ error: VoiceSignallingError.UNKNOWN_ERROR }));

      await expect(transport.closeConsumer(consumer.id)).rejects.toThrow();
      expect(consumer.closed).toBe(false);
      expect(transport.consumers.has(consumer.id)).toBe(true);
   });

   it("skips signalling when skipSignalling is true", async () => {
      await transport.createSendTransport(fakeTransportOptions());
      await transport.createRecvTransport(fakeTransportOptions());
      transport.remoteProducers.set("remote-producer-1", { producerId: "remote-producer-1", userId: "user-2", kind: "microphone" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: "microphone",
            producerId: params.producerId,
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      const consumer = await transport.createConsumer("user-2", "microphone");

      const closeHandler = vi.fn();
      transport.on("close_consumer", closeHandler);

      await transport.closeConsumer(consumer.id, true);

      expect(closeHandler).not.toHaveBeenCalled();
      expect(consumer.closed).toBe(true);
      expect(transport.consumers.has(consumer.id)).toBe(false);
   });
});

describe("applyVoiceState()", () => {
   async function withMicrophoneProducer(paused = false) {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));
      const producer = await transport.createProducer("microphone", makeTrack());
      if (paused) producer.pause();
      return producer;
   }

   it("pauses the microphone locally without needing the gateway mute state", async () => {
      const mic = await withMicrophoneProducer();

      transport.applyVoiceState(
         { isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: true },
      );

      expect(mic.paused).toBe(true);
   });

   it("pauses the microphone when the gateway reports it as muted", async () => {
      const mic = await withMicrophoneProducer();

      transport.applyVoiceState(
         { isAudioMuted: true, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(mic.paused).toBe(true);
   });

   it("resumes the microphone once neither local pause nor gateway mute apply", async () => {
      const mic = await withMicrophoneProducer(true);

      transport.applyVoiceState(
         { isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(mic.paused).toBe(false);
   });

   it("keeps the microphone paused if either local pause or gateway mute still applies", async () => {
      const mic = await withMicrophoneProducer(true);

      transport.applyVoiceState(
         { isAudioMuted: true, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(mic.paused).toBe(true);
   });

   it("keeps the microphone paused if either local pause or gateway mute still applies", async () => {
      const mic = await withMicrophoneProducer(true);

      transport.applyVoiceState(
         { isAudioMuted: true, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(mic.paused).toBe(true);
   });

   it("pauses audio consumers when the gateway reports deafened, ignoring non-audio consumers", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-audio", { producerId: "remote-audio", userId: "user-2", kind: "stream_audio" });
      transport.remoteProducers.set("remote-video", { producerId: "remote-video", userId: "user-2", kind: "camera" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const audioParams = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      const videoParams = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "video/VP8" });

      transport.on("create_consumer", (payload) =>
         payload.producerId === "remote-audio"
            ? payload.callback({
                 consumerId: audioParams.id,
                 kind: "stream_audio",
                 producerId: payload.producerId,
                 producerUserId: "user-2",
                 rtpParameters: audioParams.rtpParameters,
              })
            : payload.callback({
                 consumerId: videoParams.id,
                 kind: "camera",
                 producerId: payload.producerId,
                 producerUserId: "user-2",
                 rtpParameters: videoParams.rtpParameters,
              }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      const audioConsumer = await transport.createConsumer("user-2", "stream_audio");
      const videoConsumer = await transport.createConsumer("user-2", "camera");

      transport.applyVoiceState(
         { isAudioMuted: false, isAudioDeafened: true, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(audioConsumer.paused).toBe(true);
      expect(videoConsumer.paused).toBe(false);
   });

   it("resumes audio consumers when the gateway reports not deafened but consumers are muted, ignoring non-audio consumers", async () => {
      await createReadyTransports();
      transport.remoteProducers.set("remote-audio", { producerId: "remote-audio", userId: "user-2", kind: "stream_audio" });
      transport.remoteProducers.set("remote-video", { producerId: "remote-video", userId: "user-2", kind: "camera" });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const audioParams = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "audio/opus" });
      const videoParams = testFakeParameters.generateConsumerRemoteParameters({ codecMimeType: "video/VP8" });

      transport.on("create_consumer", (payload) =>
         payload.producerId === "remote-audio"
            ? payload.callback({
                 consumerId: audioParams.id,
                 kind: "stream_audio",
                 producerId: payload.producerId,
                 producerUserId: "user-2",
                 rtpParameters: audioParams.rtpParameters,
              })
            : payload.callback({
                 consumerId: videoParams.id,
                 kind: "camera",
                 producerId: payload.producerId,
                 producerUserId: "user-2",
                 rtpParameters: videoParams.rtpParameters,
              }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      const audioConsumer = await transport.createConsumer("user-2", "stream_audio");
      const videoConsumer = await transport.createConsumer("user-2", "camera");

      transport.applyVoiceState(
         { isAudioMuted: false, isAudioDeafened: true, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(audioConsumer.paused).toBe(true);
      expect(videoConsumer.paused).toBe(false);

      transport.applyVoiceState(
         { isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(audioConsumer.paused).toBe(false);
      expect(videoConsumer.paused).toBe(false);

      // this second check should be a no-op, since the consumers are already resumed
      transport.applyVoiceState(
         { isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
         { isAudioPaused: false },
      );

      expect(audioConsumer.paused).toBe(false);
      expect(videoConsumer.paused).toBe(false);
   });

   it("does nothing when there is no microphone producer or matching consumers", () => {
      expect(() =>
         transport.applyVoiceState(
            { isAudioMuted: true, isAudioDeafened: true, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
            { isAudioPaused: true },
         ),
      ).not.toThrow();
   });
});

describe("replaceProducerTrack()", () => {
   it("throws when no producer of that kind exists", async () => {
      await expect(transport.replaceProducerTrack("microphone", makeTrack("track-2"))).rejects.toThrow();
   });

   it("replaces the track and emits producer_updated", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));

      const producer = await transport.createProducer("microphone", makeTrack());

      const updated = vi.fn();
      transport.on("producer_updated", updated);

      const track = makeTrack("track-2");
      await transport.replaceProducerTrack("microphone", track);

      expect(producer.track).toBe(track);
      expect(updated).toHaveBeenCalledWith({ id: producer.id, kind: "microphone", track });
   });
});

describe("reset()", () => {
   it("closes transports, clears state, and returns to idle", async () => {
      await createReadyTransports();
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: "microphone" }));
      await transport.createProducer("microphone", makeTrack());

      const sendTransport = transport.sendTransport!;
      const recvTransport = transport.recvTransport!;

      const resetHandler = vi.fn();
      transport.on("reset", resetHandler);

      transport.reset();

      expect(sendTransport.closed).toBe(true);
      expect(recvTransport.closed).toBe(true);
      expect(transport.device).toBeUndefined();
      expect(transport.sendTransport).toBeUndefined();
      expect(transport.recvTransport).toBeUndefined();
      expect(transport.producers.size).toBe(0);
      expect(transport.consumers.size).toBe(0);
      expect(transport.status).toBe("idle");
      expect(resetHandler).toHaveBeenCalledTimes(1);
   });

   it("is safe to call before any transport was created", () => {
      expect(() => transport.reset()).not.toThrow();
      expect(transport.status).toBe("idle");
   });
});

describe("getters, adders and removers", () => {
   beforeEach(async () => {
      await createReadyTransports();
   });

   async function withProducer(kind: HMediaKind) {
      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.sendTransport!.id }));
      transport.on("create_producer", (payload) => payload.callback({ producerId: "producer-1", kind: kind }));
      const producer = await transport.createProducer(kind, makeTrack());
      transport.offAll("connect_transport");
      transport.offAll("create_producer");

      return producer;
   }

   async function withConsumer(kind: HMediaKind, producerId = "remote-producer-1") {
      transport.remoteProducers.set(producerId, { producerId: producerId, userId: "user-2", kind: kind });

      transport.on("connect_transport", (payload) => payload.callback({ transportId: transport.recvTransport!.id }));
      const params = testFakeParameters.generateConsumerRemoteParameters({
         codecMimeType: kind === "microphone" || kind === "stream_audio" ? "audio/opus" : "video/VP8",
      });
      transport.on("create_consumer", (payload) =>
         payload.callback({
            consumerId: params.id,
            kind: kind,
            producerId: params.producerId,
            producerUserId: "user-2",
            rtpParameters: params.rtpParameters,
         }),
      );
      transport.on("resume_consumer", (payload) => payload.callback({ consumerId: payload.id }));

      const consumer = await transport.createConsumer("user-2", kind);

      transport.offAll("connect_transport");
      transport.offAll("create_consumer");
      transport.offAll("resume_consumer");

      return consumer;
   }

   describe("getConsumer()", () => {
      it("returns the consumer of that kind and user if it exists", async () => {
         await withConsumer("microphone");

         const consumer = transport.getConsumer("user-2", "microphone");
         expect(consumer).toBeDefined();
      });
   });

   describe("getProducer()", () => {
      it("returns the producer of that kind if it exists", async () => {
         await withProducer("microphone");

         const producer = transport.getProducer("microphone");
         expect(producer).toBeDefined();
      });
   });

   describe("getConsumers()", () => {
      it("returns the consumers", async () => {
         await withConsumer("microphone");
         await withConsumer("camera");

         const consumers = transport.getConsumers();
         expect(consumers).toHaveLength(2);
      });
   });

   describe("getProducers()", () => {
      it("returns the producers", async () => {
         await withProducer("microphone");
         await withProducer("camera");

         const producers = transport.getProducers();
         expect(producers).toHaveLength(2);
      });
   });

   describe("getRemoteProducers()", () => {
      it("returns the remote producers", async () => {
         await withConsumer("microphone", "remote-producer-1");
         await withConsumer("camera", "remote-producer-2");

         const producers = transport.getRemoteProducers();
         expect(producers).toHaveLength(2);
      });
   });

   describe("getRemoteConsumers()", () => {
      it("returns the remote consumers", async () => {
         transport.remoteConsumers.set("remote-consumer-1", {
            consumerId: "remote-consumer-1",
            producerId: "producer-1",
            userId: "user-2",
            kind: "microphone",
         });
         transport.remoteConsumers.set("remote-consumer-2", { consumerId: "remote-consumer-2", producerId: "producer-2", userId: "user-3", kind: "camera" });

         const consumers = transport.getRemoteConsumers();
         expect(consumers).toHaveLength(2);
      });
   });

   describe("addRemoteProducer()", () => {
      it("adds a remote producer and emits remote_producer_created", () => {
         const created = vi.fn();
         transport.on("remote_producer_created", created);

         transport.addRemoteProducer({ producerId: "remote-1", userId: "user-2", kind: "microphone" });
         const producers = transport.getRemoteProducers();
         expect(producers).toHaveLength(1);
         expect(created).toHaveBeenCalledWith(expect.objectContaining({ producerId: "remote-1" }));
      });
   });

   describe("addRemoteConsumer()", () => {
      it("adds a remote consumer and emits remote_consumer_created", () => {
         const created = vi.fn();
         transport.on("remote_consumer_created", created);

         transport.addRemoteConsumer({ consumerId: "remote-1", producerId: "producer-1", userId: "user-2", kind: "microphone" });
         const consumers = transport.getRemoteConsumers();
         expect(consumers).toHaveLength(1);
         expect(created).toHaveBeenCalledWith(expect.objectContaining({ consumerId: "remote-1" }));
      });
   });

   describe("removeRemoteConsumer()", () => {
      it("removes a remote consumer and emits remote_consumer_closed", () => {
         const closed = vi.fn();
         transport.on("remote_consumer_closed", closed);

         transport.addRemoteConsumer({ consumerId: "remote-1", producerId: "producer-1", userId: "user-2", kind: "microphone" });
         transport.removeRemoteConsumer("remote-1");
         const consumers = transport.getRemoteConsumers();
         expect(consumers).toHaveLength(0);
         expect(closed).toHaveBeenCalledWith(expect.objectContaining({ consumerId: "remote-1" }));
      });

      it("does nothing if the remote consumer does not exist", () => {
         const closed = vi.fn();
         transport.on("remote_consumer_closed", closed);

         transport.removeRemoteConsumer("nonexistent");
         const consumers = transport.getRemoteConsumers();
         expect(consumers).toHaveLength(0);
         expect(closed).not.toHaveBeenCalled();
      });
   });

   describe("removeRemoteProducer()", () => {
      it("removes a remote producer and emits remote_producer_closed", () => {
         const closed = vi.fn();
         transport.on("remote_producer_closed", closed);

         transport.addRemoteProducer({ producerId: "remote-1", userId: "user-2", kind: "microphone" });
         transport.removeRemoteProducer("remote-1");
         const producers = transport.getRemoteProducers();
         expect(producers).toHaveLength(0);
         expect(closed).toHaveBeenCalledWith(expect.objectContaining({ producerId: "remote-1" }));
      });

      it("does nothing if the remote producer does not exist", () => {
         const closed = vi.fn();
         transport.on("remote_producer_closed", closed);

         transport.removeRemoteProducer("nonexistent");
         const producers = transport.getRemoteProducers();
         expect(producers).toHaveLength(0);
         expect(closed).not.toHaveBeenCalled();
      });
   });
});
