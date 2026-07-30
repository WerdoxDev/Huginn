/**
 * Tests for `Gateway` using MSW's native WebSocket interception (`ws.link`).
 *
 * Assumptions made about the surrounding codebase (adjust the two import
 * paths below if your file layout differs):
 *   - This file lives next to `gateway.ts`, e.g. `src/gateway.test.ts`.
 *   - `HuginnClient` is exported from the package's `index.ts` (`./`).
 *   - `GatewayOperations` / `GatewayCode` are the same runtime enums used
 *     inside `gateway.ts`, imported from `@huginnjs/shared` — the tests use
 *     the real values instead of hard-coding numbers so they stay correct
 *     if the enum changes.
 *
 * Requirements:
 *   - `msw` >= 2.6 (first version with `ws` support).
 *   - A global `WebSocket` implementation. Node >= 21 ships one natively;
 *     on older runtimes, polyfill it (e.g. via `undici`) *before* MSW's
 *     server starts listening, since the interceptor patches whatever
 *     `globalThis.WebSocket` currently points to.
 */

import type { GatewayPayload } from "@huginnjs/shared";

import { GatewayCode, GatewayOperations } from "@huginnjs/shared";
import { ws, type WebSocketHandlerConnection } from "msw";
// import type { WebSocketClientConnection } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Gateway } from "../gateway";
import { makeClient } from "./test-utils";

// ============================================================
// Test fixtures & helpers
// ============================================================

const GATEWAY_URL = "wss://gateway.test/";
const link = ws.link(GATEWAY_URL);
const server = setupServer();

function helloPayload(sessionId: string, heartbeatInterval = 30_000): string {
   return JSON.stringify({
      op: GatewayOperations.HELLO,
      d: { heartbeatInterval, sessionId },
   });
}

function dispatchPayload(t: string, d: unknown, s: number): string {
   return JSON.stringify({ op: GatewayOperations.DISPATCH, t, d, s });
}

function parse(event: MessageEvent): GatewayPayload {
   return JSON.parse(event.data as string);
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

let gateway: Gateway;

beforeEach(() => {
   gateway = new Gateway(makeClient(), {
      url: GATEWAY_URL,
      intents: 0,
      createSocket: (url: string) => new WebSocket(url),
   });
   vi.useFakeTimers();
});

afterEach(async () => {
   gateway.close();
   // Let any pending close/open events flush before the next test starts.
   // await new Promise((resolve) => setTimeout(resolve, 0));
   server.resetHandlers();
   vi.useRealTimers();
});

// ============================================================
// Connection lifecycle
// ============================================================

describe("connection lifecycle", () => {
   it("starts idle", () => {
      expect(gateway.status).toBe("idle");
      expect(gateway.isConnected).toBe(false);
      expect(gateway.isAuthenticated).toBe(false);
   });

   it("moves from connecting to connected once the socket opens", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
         }),
      );

      void gateway.connect();
      expect(gateway.status).toBe("connecting");

      await vi.waitFor(() => expect(gateway.status).toBe("helloed"));
   });

   it("throws if connect() is called while already connecting or connected", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
         }),
      );

      await gateway.connect();
      expect(gateway.status).toBe("helloed");

      await expect(gateway.connect()).rejects.toThrow();
   });

   it("moves to disconnected if the socket closes before HELLO arrives", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.close(1006, "dropped");
         }),
      );

      const result = await gateway.connect();
      expect(result).toBe(false);
      expect(gateway.status).toBe("disconnected");
   });

   it("processes HELLO, stores the session id, and moves to helloed", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
         }),
      );

      await gateway.connect();

      expect(gateway.status).toBe("helloed");
      expect(gateway.sessionId).toBe("session-123");
   });
});

// ============================================================
// Heartbeat
// ============================================================

describe("heartbeat", () => {
   it("sends periodic heartbeats using the interval from HELLO", async () => {
      const received: GatewayPayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", (event) => received.push(parse(event)));
            client.send(helloPayload("session-hb", 50));
         }),
      );

      await gateway.connect();

      // Let a couple of 50ms heartbeat ticks fire on real timers.
      // await new Promise((resolve) => setTimeout(resolve, 170));
      await vi.advanceTimersByTimeAsync(200);

      const heartbeats = received.filter((p) => p.op === GatewayOperations.HEARTBEAT);
      expect(heartbeats.length).toBeGreaterThanOrEqual(2);
   }, 8000);
});

// ============================================================
// Authentication
// ============================================================

describe("authenticate()", () => {
   it("identifies with the client token and resolves once ready is dispatched", async () => {
      const received: GatewayPayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-auth", 30_000));
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               received.push(payload);
               if (payload.op === GatewayOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { user: { id: "u1", username: "tester" } }, 1));
               }
            });
         }),
      );

      await gateway.connect();
      const result = await gateway.authenticate();

      expect(result).toEqual({ authenticated: true, retryable: true, status: "success" });
      expect(gateway.isAuthenticated).toBe(true);
      expect(gateway.user?.id).toBe("u1");

      const identify = received.find((p) => p.op === GatewayOperations.IDENTIFY);
      expect(identify).toBeDefined();
      expect((identify?.d as { token?: string })?.token).toBe("test-token");
   });

   it("resolves immediately if already authenticated", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               if (payload.op === GatewayOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { user: { id: "u1" } }, 1));
               }
            });
            client.send(helloPayload("session-auth-2", 30_000));
         }),
      );

      await gateway.connect();
      await gateway.authenticate();
      const second = await gateway.authenticate();

      expect(second).toEqual({ authenticated: true, retryable: true, status: "success" });
   });

   it("reports authentication_failed when the server rejects identify", async () => {
      const received: GatewayPayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               received.push(payload);
               if (payload.op === GatewayOperations.IDENTIFY) {
                  client.close(GatewayCode.AUTHENTICATION_FAILED, "bad token");
               }
            });
            client.send(helloPayload("session-fail", 30_000));
         }),
      );

      await gateway.connect();
      const result = await gateway.authenticate();

      expect(result).toEqual({ authenticated: false, retryable: false, status: "authentication_failed" });
      expect(gateway.isAuthenticated).toBe(false);
      // AUTHENTICATION_FAILED is a reset code, so the session should be cleared.
      expect(gateway.sessionId).toBeUndefined();
   });

   it("reports a retryable network_error if disconnected before ready arrives", async () => {
      let currentClient: WebSocketHandlerConnection["client"] | undefined;
      const received: GatewayPayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            currentClient = client;
            client.addEventListener("message", (event) => received.push(parse(event)));
            client.send(helloPayload("session-net-error", 30_000));
            // Deliberately never responds with `ready`.
         }),
      );

      await gateway.connect();

      const authPromise = gateway.authenticate();
      await vi.waitFor(() => expect(received.some((p) => p.op === GatewayOperations.IDENTIFY)).toBe(true));

      currentClient?.close(1006, "dropped");

      const result = await authPromise;
      expect(result).toEqual({ authenticated: false, retryable: true, status: "network_error" });
   });

   it("reports a retryable not_connected if the socket is not connected when authenticate() is called", async () => {
      const result = await gateway.authenticate();
      expect(result).toEqual({ authenticated: false, retryable: true, status: "not_connected" });
   });

   it("throws an error if sendResume or sendIdentify were to be called in a bad state", async () => {
      gateway = new Gateway(makeClient(""), {
         url: GATEWAY_URL,
         intents: 0,
         createSocket: (url: string) => new WebSocket(url),
      });

      expect(() => gateway["sendResume"]()).toThrow();
      expect(() => gateway["sendIdentify"]()).toThrow();
   });
});

// ============================================================
// Reconnection & resume
// ============================================================

describe("reconnection", () => {
   it("intentionally closing does not schedule a reconnect and resets the session", async () => {
      let connectionCount = 0;

      server.use(
         link.addEventListener("connection", ({ client }) => {
            connectionCount += 1;
            client.send(helloPayload("session-close", 30_000));
         }),
      );

      await gateway.connect();

      gateway.close();
      await vi.waitFor(() => expect(gateway.status).toBe("idle"));
      expect(gateway.sessionId).toBeUndefined();

      // The reconnect delay is hardcoded to 2s; wait past it and confirm
      // no second connection was ever opened.
      await vi.advanceTimersByTimeAsync(2200);
      // await new Promise((resolve) => setTimeout(resolve, 2200));
      expect(connectionCount).toBe(1);
   }, 8000);

   it("automatically reconnects after an unintentional close", async () => {
      let connectionCount = 0;

      server.use(
         link.addEventListener("connection", ({ client }) => {
            connectionCount += 1;
            client.send(helloPayload(`session-${connectionCount}`, 30_000));
         }),
      );

      await gateway.connect();

      // Simulate an unintentional drop by closing the underlying socket
      // directly (bypassing Gateway.close(), so `intentionalClose` stays false).
      gateway.socket?.close();

      await vi.waitFor(() => expect(gateway.status).toBe("disconnected"));
      await vi.advanceTimersByTimeAsync(2200);
      await vi.waitFor(() => expect(connectionCount).toBe(2), { timeout: 4000 });
   }, 8000);

   it("resumes an existing session (instead of re-identifying) after reconnecting once authenticated", async () => {
      let currentClient: WebSocketHandlerConnection["client"] | undefined;
      let connectionCount = 0;
      const opsPerConnection: number[][] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            connectionCount += 1;
            currentClient = client;
            const ops: number[] = [];
            opsPerConnection.push(ops);

            client.addEventListener("message", (event) => {
               const payload = parse(event);
               ops.push(payload.op);

               if (payload.op === GatewayOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { user: { id: "u1" } }, 1));
               }
               if (payload.op === GatewayOperations.RESUME) {
                  client.send(dispatchPayload("resumed", {}, 2));
               }
            });

            client.send(helloPayload("session-resume", 30_000));
         }),
      );

      await gateway.connect();
      await gateway.authenticate();
      expect(connectionCount).toBe(1);
      expect(gateway.isAuthenticated).toBe(true);

      // Drop the connection with a code that does NOT reset the session
      // (anything other than INVALID_SESSION / AUTHENTICATION_FAILED).
      currentClient?.close(1006, "abnormal");

      await vi.waitFor(() => expect(gateway.status).toBe("disconnected"));
      expect(gateway.canResume).toBe(true);

      await vi.advanceTimersByTimeAsync(2000);
      // The gateway re-authenticates itself automatically on reconnect
      // because it still has a `user` from the previous session.
      await vi.waitFor(() => expect(gateway.isAuthenticated).toBe(true), { timeout: 4000 });

      expect(connectionCount).toBe(2);
      expect(opsPerConnection[1]).toContain(GatewayOperations.RESUME);
      expect(opsPerConnection[1]).not.toContain(GatewayOperations.IDENTIFY);
   }, 8000);
});

// ============================================================
// Voice state
// ============================================================

describe("voice state", () => {
   async function authenticateWithUser(userId: string, extra?: (client: WebSocketHandlerConnection["client"], payload: GatewayPayload) => void) {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               if (payload.op === GatewayOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { user: { id: userId } }, 1));
               }
               extra?.(client, payload);
            });
            client.send(helloPayload("session-voice", 30_000));
         }),
      );

      await gateway.connect();
      return gateway.authenticate();
   }

   it("getVoiceToken resolves once voice_server_update and voice_state_update both arrive", async () => {
      const userId = "u1";
      const guildId = "g1";
      const channelId = "c1";
      const voiceToken = "voice-token-xyz";
      let seq = 1;

      await authenticateWithUser(userId, (client, payload) => {
         if (payload.op === GatewayOperations.VOICE_STATE_UPDATE) {
            client.send(dispatchPayload("voice_server_update", { token: voiceToken }, ++seq));
            client.send(dispatchPayload("voice_state_update", { userId, channelId, guildId }, ++seq));
         }
      });

      const token = await gateway.getVoiceToken(guildId, channelId);
      expect(token).toBe(voiceToken);
   });

   it("sendDefaultVoiceState sends a null channel/guild update and resolves on confirmation", async () => {
      const userId = "u1";
      let seq = 1;

      await authenticateWithUser(userId, (client, payload) => {
         if (payload.op === GatewayOperations.VOICE_STATE_UPDATE && (payload.d as { channelId?: string | null })?.channelId === null) {
            client.send(dispatchPayload("voice_state_update", { userId, channelId: null, guildId: null }, ++seq));
         }
      });

      await expect(gateway.sendDefaultVoiceState()).resolves.toBeUndefined();
   });

   it("updateVoiceState resolves with the confirmed voice state", async () => {
      const userId = "u1";
      const guildId = "g1";
      const channelId = "c1";
      let seq = 1;

      await authenticateWithUser(userId, (client, payload) => {
         if (payload.op === GatewayOperations.VOICE_STATE_UPDATE && (payload.d as { channelId?: string | null })?.channelId === channelId) {
            client.send(
               dispatchPayload(
                  "voice_state_update",
                  {
                     userId,
                     channelId,
                     guildId,
                     isCameraOn: true,
                     isAudioMuted: false,
                     isAudioDeafened: false,
                     isAudioStreaming: false,
                     isScreenSharing: false,
                  },
                  ++seq,
               ),
            );
         }
      });

      const state = await gateway.updateVoiceState(
         { isCameraOn: true, isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isScreenSharing: false },
         channelId,
         guildId,
      );

      expect(state.channelId).toBe(channelId);
      expect(state.userId).toBe(userId);
   });

   it("updateVoiceState should only resolve when the voice state update for the current user arrives", async () => {
      const userId1 = "u1";
      const userId2 = "u2";
      const guildId = "g1";
      const channelId = "c1";
      let seq = 1;

      await authenticateWithUser(userId1, async (client, payload) => {
         if (payload.op === GatewayOperations.VOICE_STATE_UPDATE && (payload.d as { channelId?: string | null })?.channelId === channelId) {
            client.send(
               dispatchPayload(
                  "voice_state_update",
                  {
                     userId: userId2,
                     channelId,
                     guildId,
                     isCameraOn: true,
                     isAudioMuted: false,
                     isAudioDeafened: false,
                     isAudioStreaming: false,
                     isScreenSharing: false,
                  },
                  ++seq,
               ),
            );

            client.send(
               dispatchPayload(
                  "voice_state_update",
                  {
                     userId: userId1,
                     channelId,
                     guildId,
                     isCameraOn: true,
                     isAudioMuted: false,
                     isAudioDeafened: false,
                     isAudioStreaming: false,
                     isScreenSharing: false,
                  },
                  ++seq,
               ),
            );
         }
      });

      const state = await gateway.updateVoiceState(
         { isCameraOn: true, isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isScreenSharing: false },
         channelId,
         guildId,
      );

      expect(state.channelId).toBe(channelId);
      expect(state.userId).toBe(userId1);
   });

   it("should throw if disconnected while waiting for the voice state update", async () => {
      const userId = "u1";
      const channelId = "c1";

      await authenticateWithUser(userId, (client, payload) => {
         if (payload.op === GatewayOperations.VOICE_STATE_UPDATE && (payload.d as { channelId?: string | null })?.channelId === channelId) {
            client.close(1006, "dropped");
         }
      });

      await expect(
         gateway.updateVoiceState(
            { isCameraOn: true, isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isScreenSharing: false },
            channelId,
            null,
         ),
      ).rejects.toThrow();
   });

   it("should throw if intentionally closed while waiting for the voice state update", async () => {
      const userId = "u1";
      const channelId = "c1";

      await authenticateWithUser(userId);
      const pending = gateway.updateVoiceState(
         { isCameraOn: true, isAudioMuted: false, isAudioDeafened: false, isAudioStreaming: false, isScreenSharing: false },
         channelId,
         null,
      );

      gateway.close();
      await expect(pending).rejects.toThrow();
   });

   it("getVoiceToken should return null if disconnected while waiting for the voice server update and voice state update", async () => {
      const userId = "u1";
      const channelId = "c1";

      await authenticateWithUser(userId, (client, payload) => {
         if (payload.op === GatewayOperations.VOICE_STATE_UPDATE && (payload.d as { channelId?: string | null })?.channelId === channelId) {
            client.close(1006, "dropped");
         }
      });

      const result = await gateway.getVoiceToken(null, channelId);
      expect(result).toBeNull();
   });
});

// ============================================================
// Presence
// ============================================================

describe("updatePresence()", () => {
   it("does nothing until authenticated, then sends the presence payload", async () => {
      const received: GatewayPayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", (event) => received.push(parse(event)));
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               if (payload.op === GatewayOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { user: { id: "u1" } }, 1));
               }
            });
            client.send(helloPayload("session-presence", 30_000));
         }),
      );

      // Not connected yet: should be a silent no-op.
      gateway.updatePresence({ status: "online", activities: [] } as never);
      expect(received.some((p) => p.op === GatewayOperations.PRESENCE_UPDATE)).toBe(false);

      await gateway.connect();
      await gateway.authenticate();
      gateway.updatePresence({ status: "online", activities: [] } as never);

      await vi.waitFor(() => expect(received.some((p) => p.op === GatewayOperations.PRESENCE_UPDATE)).toBe(true));
   });
});

describe("send()", () => {
   it("does nothing if the socket is not connected", () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", () => { });
         }),
      );
      expect(() => gateway["send"]({ op: GatewayOperations.HEARTBEAT, d: 0 })).not.toThrow();
   });
});
