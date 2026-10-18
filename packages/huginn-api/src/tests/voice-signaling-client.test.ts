import { GatewayCode, VoiceOperations, VoiceSignallingErrorCode } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Voice } from "../voice";
import { VoiceSignalingClient } from "../voice-signaling-client";
import { makeClient } from "./test-utils";
import { VoiceTestServer } from "./voice-test-utils";

let signaling: VoiceSignalingClient;
let server: VoiceTestServer;

beforeEach(() => {
   server = new VoiceTestServer();
   let nonce = 0;
   const client = Object.assign(makeClient(), { generateNonce: () => `request-${++nonce}` });
   signaling = new VoiceSignalingClient(client, { url: "wss://voice.test", api: "https://voice.test", createSocket: server.createSocket, class: Voice });
});
afterEach(() => {
   signaling.close();
   vi.useRealTimers();
});

async function connect() {
   await signaling.connect("token", "channel", "guild");
   await vi.waitFor(() => expect(signaling.status).toBe("authenticated"));
}

describe("voice signaling sessions", () => {
   it("identifies with the requested channel and authenticates", async () => {
      await connect();

      expect(server.messages.find((message) => message.op === VoiceOperations.IDENTIFY)).toMatchObject({
         d: { token: "token", channelId: "channel", guildId: "guild" },
      });
      expect(signaling.status).toBe("authenticated");
   });

   it("resumes an interrupted session using the last received sequence", async () => {
      vi.useFakeTimers();
      await connect();
      const originalSequence = server.sequence;
      server.socket.close(1006);
      expect(signaling.status).toBe("disconnected");

      await vi.advanceTimersByTimeAsync(2000);
      await vi.waitFor(() => expect(signaling.status).toBe("authenticated"));

      expect(server.messages.find((message) => message.op === VoiceOperations.RESUME)).toMatchObject({
         d: { sessionId: "voice-session", seq: originalSequence, token: "token" },
      });
   });

   it("requests a new token and identifies again after the server rejects the session", async () => {
      vi.useFakeTimers();
      await connect();
      signaling.on("reacquire_token", ({ callback }) => callback("replacement-token"));
      server.socket.close(GatewayCode.INVALID_SESSION);

      await vi.advanceTimersByTimeAsync(2000);
      await vi.waitFor(() => expect(signaling.status).toBe("authenticated"));

      expect(server.messages.filter((message) => message.op === VoiceOperations.IDENTIFY).at(-1)).toMatchObject({ d: { token: "replacement-token" } });
   });

   it("does not reconnect after leaving, including when recovery was already scheduled", async () => {
      vi.useFakeTimers();
      await connect();
      server.socket.close(1006);
      signaling.close();

      await vi.advanceTimersByTimeAsync(60_000);

      expect(server.sockets).toHaveLength(1);
      expect(signaling.status).toBe("idle");
      expect(signaling.connectionData).toBeUndefined();
   });

   it("delivers remote media updates to subscribers", async () => {
      await connect();
      const created = vi.fn();
      const left = vi.fn();
      signaling.on("producer_created", created);
      signaling.on("peer_left", left);
      const producer = server.addProducer("camera");
      const departure = { userId: producer.userId, producerIds: [producer.producerId], consumerIds: [], sessionId: "remote-session" };
      server.socket.dispatch("peer_left", departure);

      expect(created).toHaveBeenCalledWith(producer);
      expect(left).toHaveBeenCalledWith(departure);
   });
});

type Command = { type: string; run: (client: VoiceSignalingClient) => Promise<unknown>; request: object; result: object };
const commands: Command[] = [
   {
      type: "create_transport",
      run: (client) => client.sendCreateTransport("send"),
      request: { direction: "send" },
      result: { transportId: expect.any(String) },
   },
   {
      type: "connect_transport",
      run: (client) => client.sendConnectTransport("transport", { fingerprints: [] }),
      request: { transportId: "transport" },
      result: { transportId: "transport" },
   },
   {
      type: "restart_ice",
      run: (client) => client.sendRestartIce("transport"),
      request: { transportId: "transport" },
      result: { iceParameters: expect.any(Object) },
   },
   {
      type: "produce",
      run: (client) => client.sendCreateProducer("microphone", "transport", { codecs: [] }),
      request: { kind: "microphone", transportId: "transport" },
      result: { producerId: expect.any(String), kind: "microphone" },
   },
   { type: "close_producer", run: (client) => client.sendCloseProducer("producer"), request: { producerId: "producer" }, result: { producerId: "producer" } },
   {
      type: "consume",
      run: (client) => client.sendCreateConsumer("remote-1", "transport", { codecs: [] }),
      request: { producerId: "remote-1", transportId: "transport" },
      result: { producerId: "remote-1", consumerId: expect.any(String) },
   },
   { type: "resume_consumer", run: (client) => client.sendResumeConsumer("consumer"), request: { consumerId: "consumer" }, result: { consumerId: "consumer" } },
   { type: "pause_consumer", run: (client) => client.sendPauseConsumer("consumer"), request: { consumerId: "consumer" }, result: { consumerId: "consumer" } },
   { type: "close_consumer", run: (client) => client.sendCloseConsumer("consumer"), request: { consumerId: "consumer" }, result: { consumerId: "consumer" } },
];

describe("voice protocol commands", () => {
   it.each(commands)("sends $type and returns its server result", async ({ type, run, request, result }) => {
      await connect();
      server.addProducer();

      await expect(run(signaling)).resolves.toMatchObject(result);
      expect(server.sent(type).at(-1)).toMatchObject({ op: VoiceOperations.DISPATCH, d: { ...request, channelId: "channel", nonce: expect.any(String) } });
   });

   it.each(commands)("returns a structured error for $type before joining or after leaving", async ({ run }) => {
      await expect(run(signaling)).resolves.toMatchObject({ error: VoiceSignallingErrorCode.WRONG_STATE });
      await connect();
      signaling.close();
      await expect(run(signaling)).resolves.toMatchObject({ error: VoiceSignallingErrorCode.WRONG_STATE });
   });

   it("keeps concurrent requests separate and ignores unrelated responses", async () => {
      await connect();
      server.autoReply = false;
      const first = signaling.sendCreateTransport("send");
      const second = signaling.sendCreateTransport("recv");
      const settled = vi.fn();
      void first.then(settled);
      const [send, recv] = server.sent("create_transport");
      server.socket.dispatch("create_transport_result", { nonce: "unrelated", transportId: "wrong" });
      await Promise.resolve();
      expect(settled).not.toHaveBeenCalled();

      server.socket.dispatch("create_transport_result", { nonce: recv.d.nonce, transportId: "recv", params: {} });
      await expect(second).resolves.toMatchObject({ transportId: "recv" });
      expect(settled).not.toHaveBeenCalled();
      server.socket.dispatch("create_transport_result", { nonce: send.d.nonce, transportId: "send", params: {} });
      await expect(first).resolves.toMatchObject({ transportId: "send" });
   });

   it("returns the server's rejection to the caller", async () => {
      await connect();
      server.errors.set("produce", VoiceSignallingErrorCode.UNKNOWN_ERROR);

      await expect(signaling.sendCreateProducer("camera", "transport", { codecs: [] })).resolves.toMatchObject({
         error: VoiceSignallingErrorCode.UNKNOWN_ERROR,
      });
   });
});
