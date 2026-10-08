import { EventEmitter, GatewayCode, GatewayOperations, VoiceOperations } from "@huginnjs/shared";
import { FakeHandler, testFakeParameters } from "mediasoup-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONSTANTS } from "..";
import { Gateway } from "../gateway";
import { Voice } from "../voice";
import { VoiceManager } from "../voice-manager";
import { VoiceSignalingClient } from "../voice-signaling-client";
import { VoiceTransportManager } from "../voice-transport-manager";
import { makeClient } from "./test-utils";

// A half-open connection: close() deliberately never delivers a close event.
class SilentSocket {
   public readyState: number = WebSocket.OPEN;
   public onopen?: () => void;
   public onmessage?: (event: MessageEvent) => void;
   public onclose?: (event: CloseEvent) => void;
   public sent: unknown[] = [];
   public send = vi.fn((data: string) => this.sent.push(JSON.parse(data)));
   public close = vi.fn(() => {
      this.readyState = WebSocket.CLOSING;
   });

   public receive(data: unknown): void {
      this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }));
   }
}

const clients: Array<Gateway | VoiceSignalingClient> = [];

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
   for (const client of clients) client.close();
   clients.length = 0;
   vi.clearAllTimers();
   vi.useRealTimers();
   vi.restoreAllMocks();
});

async function connectSignaling(kind: "gateway" | "voice", interval = 40_000) {
   const sockets: SilentSocket[] = [];
   const createSocket = () => {
      const socket = new SilentSocket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
   };
   const ops = kind === "gateway" ? GatewayOperations : VoiceOperations;
   const client =
      kind === "gateway"
         ? new Gateway(makeClient(), { createSocket })
         : new VoiceSignalingClient(makeClient(), { createSocket, url: "wss://voice.test", class: Voice });
   clients.push(client);
   const connected = client instanceof Gateway ? client.connect() : client.connect("token", "channel", null);
   const socket = sockets[0]!;
   socket.onopen?.();
   socket.receive({ op: ops.HELLO, d: { heartbeatInterval: interval, sessionId: "original-session" } });
   await connected;
   const authenticated = client instanceof Gateway ? client.authenticate() : Promise.resolve();
   socket.receive({ op: ops.DISPATCH, t: "ready", s: 7, d: { user: { id: "user-me" }, producers: [], consumers: [], rtpCapabilities: {} } });
   await authenticated;
   return { client, socket, sockets, ops };
}

describe.each(["gateway", "voice"] as const)("%s heartbeat ACK deadlines", (kind) => {
   it("clears each deadline on ACK and continues heartbeating", async () => {
      const { client, socket, sockets, ops } = await connectSignaling(kind);
      for (let i = 0; i < 3; i++) {
         await vi.advanceTimersByTimeAsync(i === 0 ? 40_000 : 40_000 - CONSTANTS.HEARTBEAT_ACK_TIMEOUT_MS);
         expect(socket.sent).toContainEqual({ op: ops.HEARTBEAT, d: 7 });
         socket.receive({ op: ops.HEARTBEAT_ACK });
         await vi.advanceTimersByTimeAsync(CONSTANTS.HEARTBEAT_ACK_TIMEOUT_MS);
         expect(client.status).toBe("authenticated");
         expect(socket.close).not.toHaveBeenCalled();
      }
      expect(sockets).toHaveLength(1);
      expect(socket.send.mock.calls.filter(([data]) => JSON.parse(data).op === ops.HEARTBEAT)).toHaveLength(3);
   });

   it("recovers without onclose, resumes the session, and ignores old socket events", async () => {
      const { client, socket, sockets, ops } = await connectSignaling(kind);
      const reset = vi.fn();
      if (client instanceof Gateway) client.on("reset", reset);
      else client.on("reset", reset);
      await vi.advanceTimersByTimeAsync(40_000 + CONSTANTS.HEARTBEAT_ACK_TIMEOUT_MS);
      expect(client.status).toBe("disconnected");
      expect(client.canResume).toBe(true);
      expect(socket.close).toHaveBeenCalledWith(GatewayCode.SESSION_TIMEOUT, "Heartbeat ACK timed out");
      if (kind === "voice") expect(reset).toHaveBeenCalledExactlyOnceWith({ type: "soft" });
      else expect(reset).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(2000);
      expect(sockets).toHaveLength(2);
      const replacement = sockets[1]!;
      replacement.receive({ op: ops.HELLO, d: { heartbeatInterval: 40_000, sessionId: "replacement-session" } });
      await vi.advanceTimersByTimeAsync(0);
      expect(replacement.sent).toContainEqual({
         op: ops.RESUME,
         d: { token: kind === "gateway" ? "test-token" : "token", sessionId: "original-session", seq: 7 },
      });
      replacement.receive({ op: ops.DISPATCH, t: "resumed", s: 8 });
      await vi.advanceTimersByTimeAsync(40_000);

      // Neither a late ACK nor a late close may affect the replacement.
      socket.receive({ op: ops.HEARTBEAT_ACK });
      socket.onclose?.({ code: GatewayCode.INVALID_SESSION, reason: "late close" } as CloseEvent);
      expect(client.status).toBe("authenticated");
      await vi.advanceTimersByTimeAsync(CONSTANTS.HEARTBEAT_ACK_TIMEOUT_MS);
      expect(client.status).toBe("disconnected");
      expect(replacement.close).toHaveBeenCalledTimes(1);
   });

   it("does not postpone the deadline when additional heartbeats are sent", async () => {
      const { client } = await connectSignaling(kind, 1000);
      await vi.advanceTimersByTimeAsync(1000 + CONSTANTS.HEARTBEAT_ACK_TIMEOUT_MS - 1);
      expect(client.status).toBe("authenticated");
      await vi.advanceTimersByTimeAsync(1);
      expect(client.status).toBe("disconnected");
   });

   it.each([40_000, 40_000 + CONSTANTS.HEARTBEAT_ACK_TIMEOUT_MS])("does not reconnect after intentional close at %i ms", async (elapsed) => {
      const { client, socket, sockets } = await connectSignaling(kind);
      await vi.advanceTimersByTimeAsync(elapsed);
      client.close();
      const closeCount = socket.close.mock.calls.length;
      await vi.advanceTimersByTimeAsync(80_000);
      expect(sockets).toHaveLength(1);
      expect(socket.close).toHaveBeenCalledTimes(closeCount);
   });
});

function createVoiceManager() {
   const gateway = Object.assign(new EventEmitter<Record<string, unknown>>(), {
      status: "authenticated",
      isAuthenticated: true,
      user: { id: "user-me" },
      updateVoiceState: vi.fn(async (): Promise<void> => undefined),
      sendDefaultVoiceState: vi.fn(async () => undefined),
   });
   const signaling = Object.assign(new EventEmitter<Record<string, unknown>>(), {
      connect: vi.fn(async () => true),
      close: vi.fn(),
      setVoiceToken: vi.fn(),
   });
   const voice = Object.assign(new EventEmitter<Record<string, unknown>>(), {
      status: "idle",
      signaling,
      transport: Object.assign(new EventEmitter<Record<string, unknown>>(), { applyVoiceState: vi.fn() }),
   });
   const manager = new VoiceManager(makeClient(), gateway as unknown as Gateway, voice as unknown as Voice);
   return { gateway, voice, manager };
}

describe("voice token deadlines", () => {
   it("rejects a missing token and allows a subsequent join", async () => {
      const { gateway, voice, manager } = createVoiceManager();
      const join = manager.connectVoice(null, "channel");
      const rejected = expect(join).rejects.toThrow("Voice token request timed out");
      await vi.advanceTimersByTimeAsync(CONSTANTS.VOICE_TOKEN_TIMEOUT_MS);
      await rejected;
      expect(voice.signaling.connect).not.toHaveBeenCalled();

      const retry = manager.connectVoice(null, "channel");
      gateway.emit("voice_server_update", { token: "new-token" });
      await vi.advanceTimersByTimeAsync(0);
      expect(voice.signaling.connect).toHaveBeenCalledExactlyOnceWith("new-token", "channel", null);
      voice.emit("status_changed", "ready");
      await retry;
      expect(vi.getTimerCount()).toBe(0);
   });

   it("bounds state confirmation too, even with a supplied token, and ignores late completion", async () => {
      const { gateway, voice, manager } = createVoiceManager();
      let confirm!: () => void;
      gateway.updateVoiceState.mockImplementationOnce(
         () =>
            new Promise<void>((resolve) => {
               confirm = resolve;
            }),
      );
      const join = manager.connectVoice(null, "channel", "provided-token");
      const rejected = expect(join).rejects.toThrow("Voice token request timed out");
      await vi.advanceTimersByTimeAsync(CONSTANTS.VOICE_TOKEN_TIMEOUT_MS);
      await rejected;
      confirm();
      gateway.emit("voice_server_update", { token: "late-token" });
      await vi.advanceTimersByTimeAsync(0);
      expect(voice.signaling.connect).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
   });

   it("accepts a token arriving before state confirmation and clears the deadline", async () => {
      const { gateway, voice, manager } = createVoiceManager();
      let confirm!: () => void;
      gateway.updateVoiceState.mockImplementationOnce(
         () =>
            new Promise<void>((resolve) => {
               confirm = resolve;
            }),
      );
      const join = manager.connectVoice(null, "channel");
      gateway.emit("voice_server_update", { token: "early-token" });
      await vi.advanceTimersByTimeAsync(1000);
      expect(voice.signaling.connect).not.toHaveBeenCalled();
      confirm();
      await vi.advanceTimersByTimeAsync(0);
      voice.emit("status_changed", "ready");
      await join;
      await vi.advanceTimersByTimeAsync(CONSTANTS.VOICE_TOKEN_TIMEOUT_MS);
      expect(voice.signaling.connect).toHaveBeenCalledExactlyOnceWith("early-token", "channel", null);
      expect(vi.getTimerCount()).toBe(0);
   });

   it("cancels the token request on disconnect and never joins on a late token", async () => {
      const { gateway, voice, manager } = createVoiceManager();
      const join = manager.connectVoice(null, "channel");
      const rejected = expect(join).rejects.toThrow("Voice token request cancelled");
      await vi.advanceTimersByTimeAsync(0);
      await manager.disconnectVoice();
      await rejected;
      gateway.emit("voice_server_update", { token: "late-token" });
      await vi.advanceTimersByTimeAsync(CONSTANTS.VOICE_TOKEN_TIMEOUT_MS);
      expect(voice.signaling.connect).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
   });

   it("bounds token reacquisition and reports its failure", async () => {
      const { voice } = createVoiceManager();
      const callback = vi.fn();
      const errback = vi.fn();
      voice.signaling.emit("reacquire_token", { callback, errback });
      await vi.advanceTimersByTimeAsync(CONSTANTS.VOICE_TOKEN_TIMEOUT_MS);
      expect(callback).not.toHaveBeenCalled();
      expect(errback).toHaveBeenCalledTimes(1);
      expect(voice.signaling.close).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
   });

   it("cleans up the request when gateway state confirmation fails", async () => {
      const { gateway, voice, manager } = createVoiceManager();
      gateway.updateVoiceState.mockRejectedValueOnce(new Error("Gateway disconnected"));
      await expect(manager.connectVoice(null, "channel")).rejects.toThrow("Gateway disconnected");
      gateway.emit("voice_server_update", { token: "late-token" });
      await vi.advanceTimersByTimeAsync(CONSTANTS.VOICE_TOKEN_TIMEOUT_MS);
      expect(voice.signaling.connect).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
   });

   it("uses an unexpired cached token without leaving a deadline behind", async () => {
      const { gateway, voice, manager } = createVoiceManager();
      gateway.emit("voice_server_update", { token: "cached-token" });
      const join = manager.connectVoice(null, "channel");
      await vi.advanceTimersByTimeAsync(0);
      expect(voice.signaling.connect).toHaveBeenCalledExactlyOnceWith("cached-token", "channel", null);
      voice.emit("status_changed", "ready");
      await join;
      expect(vi.getTimerCount()).toBe(0);
   });
});

describe("TURN credential deadlines", () => {
   async function createTransportManager() {
      const manager = new VoiceTransportManager(makeClient(), { deviceOptions: { handlerFactory: FakeHandler.createFactory(testFakeParameters) } });
      await manager.initializeDevice(testFakeParameters.generateRouterRtpCapabilities());
      return manager;
   }

   it.each(["send", "recv"] as const)("aborts a stalled fetch and still creates the %s transport", async (direction) => {
      let signal!: AbortSignal;
      vi.spyOn(globalThis, "fetch").mockImplementation(
         (_url, init) =>
            new Promise((_resolve, reject) => {
               signal = init!.signal!;
               signal.addEventListener("abort", () => reject(signal.reason), { once: true });
            }),
      );
      const manager = await createTransportManager();
      const options = testFakeParameters.generateTransportRemoteParameters();
      const creating = direction === "send" ? manager.createSendTransport(options) : manager.createRecvTransport(options);
      await vi.advanceTimersByTimeAsync(CONSTANTS.TURN_CREDENTIAL_TIMEOUT_MS);
      await creating;
      expect(signal.aborted).toBe(true);
      expect(direction === "send" ? manager.sendTransport : manager.recvTransport).toBeDefined();
      expect(vi.getTimerCount()).toBe(0);
      manager.reset();
   });

   it("keeps the deadline active while the response body is stalled", async () => {
      let signal!: AbortSignal;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
         signal = init!.signal!;
         return new Response(
            new ReadableStream({
               start(controller) {
                  signal.addEventListener("abort", () => controller.error(signal.reason), { once: true });
               },
            }),
         );
      });
      const manager = await createTransportManager();
      const creating = manager.createSendTransport(testFakeParameters.generateTransportRemoteParameters());
      await vi.advanceTimersByTimeAsync(CONSTANTS.TURN_CREDENTIAL_TIMEOUT_MS);
      await creating;
      expect(signal.aborted).toBe(true);
      expect(manager.sendTransport).toBeDefined();
      manager.reset();
   });

   it("clears the timeout after receiving credentials", async () => {
      const iceServers = [{ urls: "turn:relay.test:3478" }];
      const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ iceServers }));
      const manager = await createTransportManager();
      const create = vi.spyOn(manager.device!, "createSendTransport");
      await manager.createSendTransport(testFakeParameters.generateTransportRemoteParameters());
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ iceServers }));
      await vi.advanceTimersByTimeAsync(CONSTANTS.TURN_CREDENTIAL_TIMEOUT_MS);
      expect(fetch.mock.calls[0]![1]!.signal!.aborted).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
      manager.reset();
   });

   it("falls back and clears the deadline when the credential endpoint returns an error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ error: "unavailable" }, { status: 503 }));
      const manager = await createTransportManager();
      const create = vi.spyOn(manager.device!, "createSendTransport");
      await manager.createSendTransport(testFakeParameters.generateTransportRemoteParameters());
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ iceServers: undefined }));
      expect(vi.getTimerCount()).toBe(0);
      manager.reset();
   });
});
