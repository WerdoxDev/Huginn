import { CONSTANTS, GatewayCode, GatewayOperations } from "@huginnjs/shared";
import { UnsecuredJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Tokens } from "..";
import type { GatewayOptions, RESTOptions } from "../types";

import { HuginnClient } from "../huginn-client";

const clients: HuginnClient[] = [];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const unauthorized = (status = 401) => json({ code: 0, message: "Unauthorized" }, status);

function accessToken(seconds = 7 * 24 * 60 * 60, sessionId = "session"): string {
   return new UnsecuredJWT({ id: "user", sessionId }).setExpirationTime(Math.floor(Date.now() / 1000) + seconds).encode();
}

function deferred<T>() {
   let resolve!: (value: T) => void;
   let reject!: (reason: unknown) => void;
   const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
   });
   return { promise, resolve, reject };
}

function createClient(makeRequest: RESTOptions["makeRequest"], gateway?: Partial<GatewayOptions>): HuginnClient {
   const client = new HuginnClient({ rest: { api: "https://huginn.test/api", makeRequest }, gateway });
   clients.push(client);
   return client;
}

function authorization(init: RequestInit): string | null {
   return new Headers(init.headers).get("Authorization");
}

beforeEach(() => {
   vi.useFakeTimers();
   vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
});

afterEach(() => {
   for (const client of clients.splice(0)) client.clearSessionLocally();
   vi.clearAllTimers();
   vi.useRealTimers();
   vi.restoreAllMocks();
});

describe("session restoration and refresh", () => {
   it("restores and persists both saved tokens, then rotates them before the seven-day expiry", async () => {
      const initial = { token: accessToken(), refreshToken: "saved-refresh" };
      let replacement: Tokens;
      const makeRequest = vi.fn(async (url: string, init: RequestInit) => {
         if (url.endsWith("/auth/refresh-token")) {
            expect(JSON.parse(init.body as string)).toEqual({ refreshToken: "saved-refresh" });
            replacement = { token: accessToken(), refreshToken: "next-refresh" };
            return json(replacement);
         }
         expect(authorization(init)).toBe(`Bearer ${replacement.token}`);
         return json([]);
      });
      const client = createClient(makeRequest);
      vi.spyOn(client.gateway, "connect").mockResolvedValue(true);
      vi.spyOn(client.gateway, "authenticate").mockResolvedValue({ authenticated: true, status: "success", retryable: false });
      const stored = new Map<string, string>(Object.entries(initial));
      const listener = vi.fn((token?: string, refreshToken?: string) => {
         if (token) stored.set("token", token);
         else stored.delete("token");
         if (refreshToken) stored.set("refreshToken", refreshToken);
         else stored.delete("refreshToken");
      });
      client.tokenHandler.onChange(listener);

      expect((await client.initialize({ tokens: initial })).success).toBe(true);
      expect(listener).toHaveBeenCalledExactlyOnceWith(initial.token, initial.refreshToken);
      expect(Object.fromEntries(stored)).toEqual(initial);

      const refreshed = client.tokenHandler.waitForTokenRefresh();
      await vi.advanceTimersByTimeAsync(7 * 24 * 60 * 60 * 1000 - 30_000);
      expect(await refreshed).toBe(true);
      expect(Object.fromEntries(stored)).toEqual(replacement!);
      expect(listener).toHaveBeenCalledTimes(2);
      await expect(client.channels.getMessages("channel")).resolves.toEqual([]);
      await expect(client.channels.createMessage("channel", { content: "hello" })).resolves.toEqual([]);
   });

   it("retries network and server failures at the configured fixed delay and keeps the saved credentials", async () => {
      let attempt = 0;
      const makeRequest = vi.fn(async () => {
         attempt++;
         if (attempt === 1) throw new TypeError("Failed to fetch");
         if (attempt === 2) return new Response("Service unavailable", { status: 503 });
         return json({ token: accessToken(), refreshToken: "rotated" });
      });
      const client = createClient(makeRequest);
      const initial = { token: accessToken(3), refreshToken: "saved" };
      client.tokenHandler.setTokens(initial);

      const firstAttempt = client.tokenHandler.waitForTokenRefresh();
      await vi.advanceTimersByTimeAsync(2000);
      expect(await firstAttempt).toBe(false);
      expect(client.tokenHandler.token).toBe(initial.token);
      expect(client.tokenHandler.refreshToken).toBe(initial.refreshToken);
      expect(makeRequest).toHaveBeenCalledTimes(1);
      for (const attempt of [2, 3]) {
         await vi.advanceTimersByTimeAsync(CONSTANTS.TOKEN_REFRESH_RETRY_DELAY_MS - 1);
         expect(makeRequest).toHaveBeenCalledTimes(attempt - 1);
         await vi.advanceTimersByTimeAsync(1);
         expect(makeRequest).toHaveBeenCalledTimes(attempt);
      }
      expect(client.tokenHandler.refreshToken).toBe("rotated");
   });

   it.each(["delayed timer", "slow refresh"])("shares a refresh and holds channel reads and sends during a %s", async (scenario) => {
      const refresh = deferred<Response>();
      const makeRequest = vi.fn(async (url: string, _init: RequestInit) => (url.endsWith("/auth/refresh-token") ? refresh.promise : json([])));
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens({ token: accessToken(3), refreshToken: "saved" });
      if (scenario === "slow refresh") await vi.advanceTimersByTimeAsync(2000);
      vi.setSystemTime(new Date(Date.now() + 4000));

      const read = client.channels.getMessages("channel");
      const send = client.channels.createMessage("channel", { content: "hello" });
      await vi.advanceTimersByTimeAsync(0);
      expect(makeRequest).toHaveBeenCalledTimes(1);
      expect(makeRequest.mock.calls[0][0]).toContain("/auth/refresh-token");

      const replacement = { token: accessToken(), refreshToken: "rotated" };
      refresh.resolve(json(replacement));
      await expect(Promise.all([read, send])).resolves.toEqual([[], []]);
      expect(makeRequest).toHaveBeenCalledTimes(3);
      for (const [, init] of makeRequest.mock.calls.slice(1)) {
         expect(authorization(init)).toBe(`Bearer ${replacement.token}`);
      }
   });

   it.each([401, 403])("stops refreshing and clears the token pair when refresh is rejected with %s", async (status) => {
      const makeRequest = vi.fn(async () => unauthorized(status));
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens({ token: accessToken(-1), refreshToken: "revoked" });

      await expect(client.channels.getMessages("channel")).rejects.toMatchObject({ status });
      expect(makeRequest).toHaveBeenCalledTimes(1);
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
      expect(vi.getTimerCount()).toBe(0);
   });

   it.each(["success", "failure"])("ignores a late refresh %s after logout or another sign-in", async (outcome) => {
      for (const nextSession of [{}, { token: accessToken(60, "new-session"), refreshToken: "new-session-refresh" }]) {
         const refresh = deferred<Response>();
         const client = createClient(() => refresh.promise);
         client.tokenHandler.setTokens({ token: accessToken(), refreshToken: "saved" });
         const pending = client.tokenHandler.refresh();
         await vi.advanceTimersByTimeAsync(0);
         client.tokenHandler.setTokens(nextSession);
         if (outcome === "success") refresh.resolve(json({ token: accessToken(), refreshToken: "stale" }));
         else refresh.resolve(unauthorized());

         expect(await pending).toBe(false);
         expect(client.tokenHandler.token).toBe(nextSession.token);
         expect(client.tokenHandler.refreshToken).toBe(nextSession.refreshToken);
      }
   });
});

describe("REST authentication recovery", () => {
   it("refreshes once for concurrent 401s and replays each request once with the same message body", async () => {
      const initial = { token: accessToken(), refreshToken: "saved" };
      const replacement = { token: accessToken(60), refreshToken: "rotated" };
      const refresh = deferred<Response>();
      const makeRequest = vi.fn(async (url: string, init: RequestInit) => {
         if (url.endsWith("/auth/refresh-token")) return refresh.promise;
         return authorization(init) === `Bearer ${initial.token}` ? unauthorized() : json([]);
      });
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens(initial);

      const read = client.channels.getMessages("channel");
      const send = client.channels.createMessage("channel", { content: "hello", nonce: "123" });
      await vi.advanceTimersByTimeAsync(0);
      expect(makeRequest.mock.calls.filter(([url]) => url.endsWith("/auth/refresh-token"))).toHaveLength(1);
      refresh.resolve(json(replacement));
      await expect(Promise.all([read, send])).resolves.toEqual([[], []]);

      expect(makeRequest).toHaveBeenCalledTimes(5);
      const sends = makeRequest.mock.calls.filter(([url, init]) => url.includes("/channels/") && init.method === "POST");
      expect(sends).toHaveLength(2);
      expect(sends[1][1].body).toBe(sends[0][1].body);
      expect(authorization(sends[1][1])).toBe(`Bearer ${replacement.token}`);
   });

   it("uses an already rotated token when an older request returns a late 401", async () => {
      const initial = { token: accessToken(), refreshToken: "saved" };
      const replacement = { token: accessToken(60), refreshToken: "rotated" };
      const late = deferred<Response>();
      let oldRequests = 0;
      const makeRequest = vi.fn(async (url: string, init: RequestInit) => {
         if (url.endsWith("/auth/refresh-token")) return json(replacement);
         if (authorization(init) === `Bearer ${initial.token}`) return ++oldRequests === 1 ? late.promise : unauthorized();
         return json([]);
      });
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens(initial);
      const first = client.channels.getMessages("first");
      await vi.advanceTimersByTimeAsync(0);
      await expect(client.channels.getMessages("second")).resolves.toEqual([]);
      late.resolve(unauthorized());
      await expect(first).resolves.toEqual([]);
      expect(makeRequest.mock.calls.filter(([url]) => url.endsWith("/auth/refresh-token"))).toHaveLength(1);
      expect(client.tokenHandler.token).toBe(replacement.token);
   });

   it("bounds recovery to one retry and passes original request metadata to the error handler", async () => {
      const makeRequest = vi.fn(async (url: string) =>
         url.endsWith("/auth/refresh-token") ? json({ token: accessToken(60), refreshToken: "rotated" }) : unauthorized(),
      );
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens({ token: accessToken(), refreshToken: "saved" });
      const body = { content: "hello", nonce: "123" };
      await expect(client.channels.createMessage("channel", body)).rejects.toMatchObject({ status: 401, requestBody: { json: body } });
      expect(makeRequest).toHaveBeenCalledTimes(3);
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBe("rotated");
      expect(vi.getTimerCount()).toBe(0);
   });

   it("preserves credentials and propagates a transient refresh failure after a 401", async () => {
      const networkError = new TypeError("Failed to fetch");
      const makeRequest = vi.fn(async (url: string) => {
         if (url.endsWith("/auth/refresh-token")) throw networkError;
         return unauthorized();
      });
      const client = createClient(makeRequest);
      const initial = { token: accessToken(), refreshToken: "saved" };
      client.tokenHandler.setTokens(initial);

      await expect(client.channels.getMessages("channel")).rejects.toBe(networkError);
      expect(makeRequest).toHaveBeenCalledTimes(2);
      expect(client.tokenHandler.token).toBe(initial.token);
      expect(client.tokenHandler.refreshToken).toBe(initial.refreshToken);
      expect(vi.getTimerCount()).toBe(1);
   });

   it("does not refresh or clear the client session for an explicit OAuth identity token", async () => {
      const makeRequest = vi.fn(async () => unauthorized());
      const client = createClient(makeRequest);
      const initial = { token: accessToken(), refreshToken: "saved" };
      client.tokenHandler.setTokens(initial);

      await expect(client.oauth.confirmOAuth({ username: "user", displayName: null, avatar: null }, "identity-token")).rejects.toMatchObject({ status: 401 });
      expect(makeRequest).toHaveBeenCalledTimes(1);
      expect(client.tokenHandler.token).toBe(initial.token);
      expect(client.tokenHandler.refreshToken).toBe(initial.refreshToken);
   });

   it("does not replay an old mutation or clear credentials after the user changes session", async () => {
      const late = deferred<Response>();
      const makeRequest = vi.fn(() => late.promise);
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens({ token: accessToken(), refreshToken: "saved" });
      const send = client.channels.createMessage("channel", { content: "hello" });
      await vi.advanceTimersByTimeAsync(0);
      const replacement = { token: accessToken(60, "other-session"), refreshToken: "other-refresh" };
      client.tokenHandler.setTokens(replacement);
      late.resolve(unauthorized());

      await expect(send).rejects.toMatchObject({ status: 401 });
      expect(makeRequest).toHaveBeenCalledTimes(1);
      expect(client.tokenHandler.token).toBe(replacement.token);
      expect(client.tokenHandler.refreshToken).toBe(replacement.refreshToken);
   });

   it("never schedules or sends an empty refresh token", async () => {
      const makeRequest = vi.fn(async () => unauthorized());
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens({ token: accessToken(-1) });
      expect(vi.getTimerCount()).toBe(0);
      await expect(client.channels.getMessages("channel")).rejects.toMatchObject({ status: 401 });
      expect(makeRequest).toHaveBeenCalledTimes(1);
      expect(makeRequest.mock.calls[0]).toEqual(expect.arrayContaining([expect.stringContaining("/channels/")]));
      expect(client.tokenHandler.token).toBeUndefined();
   });

   it("does not send an upload canceled while it waited for refresh", async () => {
      const refresh = deferred<Response>();
      const makeRequest = vi.fn(() => refresh.promise);
      const client = createClient(makeRequest);
      client.tokenHandler.setTokens({ token: accessToken(-1), refreshToken: "saved" });
      const controller = new AbortController();
      const send = client.channels.createMessage("channel", { content: "hello" }, undefined, undefined, controller.signal);
      await vi.advanceTimersByTimeAsync(0);
      controller.abort();
      refresh.resolve(json({ token: accessToken(), refreshToken: "rotated" }));

      await expect(send).rejects.toMatchObject({ name: "AbortError" });
      expect(makeRequest).toHaveBeenCalledTimes(1);
   });
});

describe("gateway authentication", () => {
   it("continues reconnecting after a transient token refresh failure", async () => {
      type Socket = {
         readyState: number;
         onopen?: () => void;
         onmessage?: (event: MessageEvent) => void;
         onclose?: (event: CloseEvent) => void;
         send: ReturnType<typeof vi.fn>;
         close: ReturnType<typeof vi.fn>;
      };
      const sockets: Socket[] = [];
      const replacement = { token: accessToken(14 * 24 * 60 * 60), refreshToken: "rotated" };
      const makeRequest = vi
         .fn()
         .mockRejectedValueOnce(new TypeError("Failed to fetch"))
         .mockImplementation(async () => json(replacement));
      const client = createClient(makeRequest, {
         createSocket() {
            const receive = (payload: unknown) => socket.onmessage?.(new MessageEvent("message", { data: JSON.stringify(payload) }));
            const socket: Socket = {
               readyState: WebSocket.OPEN,
               send: vi.fn((data: string) => {
                  const { op } = JSON.parse(data);
                  if (op === GatewayOperations.IDENTIFY || op === GatewayOperations.RESUME) {
                     queueMicrotask(() =>
                        receive({
                           op: GatewayOperations.DISPATCH,
                           t: op === GatewayOperations.IDENTIFY ? "ready" : "resumed",
                           s: 1,
                           d: op === GatewayOperations.IDENTIFY ? { user: { id: "user" } } : undefined,
                        }),
                     );
                  }
               }),
               close: vi.fn(),
            };
            sockets.push(socket);
            queueMicrotask(() => {
               socket.onopen?.();
               receive({ op: GatewayOperations.HELLO, d: { heartbeatInterval: 40_000, sessionId: "gateway-session" } });
            });
            return socket as unknown as WebSocket;
         },
      });
      client.tokenHandler.setTokens({ token: accessToken(), refreshToken: "saved" });
      await client.gateway.connect();
      await client.gateway.authenticate();
      const reconnected = vi.fn();
      client.gateway.listen("reconnected", reconnected);
      vi.setSystemTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1000));
      sockets[0].onclose?.({ code: GatewayCode.SESSION_TIMEOUT, reason: "connection lost" } as CloseEvent);

      await vi.advanceTimersByTimeAsync(2000);
      expect(client.gateway.isAuthenticated).toBe(false);
      expect(reconnected).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(2000);
      expect(client.gateway.isAuthenticated).toBe(true);
      expect(reconnected).toHaveBeenCalledOnce();
      expect(sockets).toHaveLength(2);
      expect(JSON.parse(sockets[1].send.mock.calls[0][0])).toMatchObject({ op: GatewayOperations.RESUME, d: { token: replacement.token } });
   });

   it("refreshes an expired access token before identifying after a suspended timer", async () => {
      const replacement = { token: accessToken(), refreshToken: "rotated" };
      const refresh = deferred<Response>();
      const socket = {
         readyState: WebSocket.OPEN,
         onmessage: undefined as ((event: MessageEvent) => void) | undefined,
         send: vi.fn(),
         close: vi.fn(),
      };
      const client = createClient(() => refresh.promise, { createSocket: () => socket as unknown as WebSocket });
      client.tokenHandler.setTokens({ token: accessToken(3), refreshToken: "saved" });
      vi.setSystemTime(new Date(Date.now() + 4000));
      const connected = client.gateway.connect();
      socket.onmessage?.(
         new MessageEvent("message", { data: JSON.stringify({ op: GatewayOperations.HELLO, d: { heartbeatInterval: 40_000, sessionId: "gateway-session" } }) }),
      );
      await connected;
      const authenticated = client.gateway.authenticate();
      await vi.advanceTimersByTimeAsync(0);
      expect(socket.send).not.toHaveBeenCalled();
      refresh.resolve(json(replacement));
      await vi.advanceTimersByTimeAsync(0);
      expect(JSON.parse(socket.send.mock.calls[0][0])).toMatchObject({ op: GatewayOperations.IDENTIFY, d: { token: replacement.token } });
      socket.onmessage?.(
         new MessageEvent("message", { data: JSON.stringify({ op: GatewayOperations.DISPATCH, t: "ready", s: 1, d: { user: { id: "user" } } }) }),
      );
      await expect(authenticated).resolves.toMatchObject({ authenticated: true });
   });
});
