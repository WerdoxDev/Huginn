/**
 * Tests for `HuginnClient`.
 *
 * Unlike `gateway.test.ts` (which exercises the real WebSocket handshake via
 * MSW), this file treats `HuginnClient` as a unit: every collaborator it
 * constructs (`Gateway`, `REST`, `AuthAPI`, `TokenHandler`, `Voice`,
 * `VoiceManager`, and the other `rest-apis/*` classes) is mocked. That's
 * deliberate — `HuginnClient`'s constructor eagerly calls
 * `this.gateway.connect()`, and its real job here is orchestration
 * (session restore, token bookkeeping, cleanup ordering), not network I/O.
 * `jose`'s `decodeJwt` and `@huginn/shared`'s `snowflake` are left real
 * since they're pure/local and exercising them is part of the point.
 *
 * Assumptions (adjust if your layout differs):
 *   - This file lives next to `huginn-client.ts`, e.g. `src/huginn-client.test.ts`.
 *   - `./rest`, `./cdn`, and the `./rest-apis/*` modules (other than `auth`)
 *     export a single class each and are safe to auto-mock with `vi.mock(path)`
 *     (no factory) — Vitest replaces the class with a mock constructor whose
 *     instance methods are all `vi.fn()`. If any of those modules have more
 *     complex exports, swap in an explicit factory like the ones used below
 *     for `./gateway` / `./rest-apis/auth`.
 */

import type { APIPostLoginResult, APIPostRegisterResult, APIUser, LoginCredentials, RegisterUser, Tokens } from "@huginn/shared";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gateway } from "../gateway";
import { HuginnClient } from "../huginn-client";

// ============================================================
// Mocks
// ============================================================

vi.mock("../gateway.ts", () => ({
   Gateway: vi.fn(function () {
      return {
         connect: vi.fn(),
         close: vi.fn(),
         authenticate: vi.fn(),
         user: undefined as APIUser | undefined,
         on: vi.fn(),
      };
   }),
}));

vi.mock("../token-handler.ts", () => ({
   TokenHandler: vi.fn(function () {
      return {
         token: undefined as string | undefined,
         refreshToken: undefined as string | undefined,
      };
   }),
}));

vi.mock("../voice.ts", () => ({
   Voice: vi.fn(function () {
      return {
         signaling: { close: vi.fn() },
      };
   }),
}));

vi.mock("../voice-manager.ts", () => ({
   VoiceManager: vi.fn(function () {
      return {};
   }),
}));

vi.mock("../rest-apis/auth.ts", () => ({
   AuthAPI: vi.fn(function () {
      return {
         login: vi.fn(),
         register: vi.fn(),
         logout: vi.fn(),
         refreshToken: vi.fn(),
      };
   }),
}));

// These aren't exercised by any test below; auto-mock so construction is
// side-effect-free without needing to know their internals.
vi.mock("../rest.ts");
vi.mock("../cdn.ts");
vi.mock("../rest-apis/application.ts");
vi.mock("../rest-apis/channel.ts");
vi.mock("../rest-apis/common.ts");
vi.mock("../rest-apis/gif.ts");
vi.mock("../rest-apis/message.ts");
vi.mock("../rest-apis/oauth.ts");
vi.mock("../rest-apis/relationship.ts");
vi.mock("../rest-apis/user.ts");

// ============================================================
// Helpers
// ============================================================

/** Builds a minimal, unsigned JWT string with the given claims. `jose`'s `decodeJwt` does not verify signatures, so this is enough to drive `validateAccessToken`. */
function makeJwt(claims: Record<string, unknown>): string {
   const base64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
   const header = base64url({ alg: "none", typ: "JWT" });
   const payload = base64url(claims);
   return `${header}.${payload}.`;
}

function futureToken(): string {
   return makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
}

function expiredToken(): string {
   return makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
}

function makeUser(id: string): APIUser {
   return { id, username: `user-${id}` } as unknown as APIUser;
}

/** `gateway.user` is a plain property (not a mock function), so it needs a direct cast to set from tests. */
function setGatewayUser(client: HuginnClient, user: APIUser | undefined): void {
   (client.gateway as unknown as { user?: APIUser }).user = user;
}

// ============================================================
// Setup
// ============================================================

let client: HuginnClient;

beforeEach(() => {
   vi.clearAllMocks();
   client = new HuginnClient();
});

afterEach(() => {
   vi.useRealTimers();
});

// ============================================================
// Construction
// ============================================================

describe("construction", () => {
   it("builds every sub-client and connects the gateway immediately", () => {
      expect(client.rest).toBeDefined();
      expect(client.cdn).toBeDefined();
      expect(client.tokenHandler).toBeDefined();
      expect(client.gateway).toBeDefined();
      expect(client.voice).toBeDefined();
      expect(client.voiceManager).toBeDefined();
      expect(client.users).toBeDefined();
      expect(client.relationships).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.channels).toBeDefined();
      expect(client.messages).toBeDefined();
      expect(client.oauth).toBeDefined();
      expect(client.applications).toBeDefined();
      expect(client.common).toBeDefined();
      expect(client.gifs).toBeDefined();

      expect(vi.mocked(Gateway)).toHaveBeenCalledWith(client, client.options.gateway);
      expect(vi.mocked(client.gateway.connect)).toHaveBeenCalledTimes(1);
   });

   it("has no current user until initialize() succeeds", () => {
      expect(client.currentUser).toBeUndefined();
   });
});

// ============================================================
// initialize() - no stored tokens
// ============================================================

describe("initialize() without stored tokens", () => {
   it("authenticates against the gateway directly and stores the resulting user", async () => {
      const user = makeUser("u1");
      vi.mocked(client.gateway.authenticate).mockImplementation(async () => {
         setGatewayUser(client, user);
         return { authenticated: true, retryable: true, status: "success" };
      });

      client.tokenHandler.token = "good-token";
      const result = await client.initialize();

      expect(result).toEqual({ success: true, status: "success", retryable: false });
      expect(client.currentUser).toEqual(user);
      expect(vi.mocked(client.auth.refreshToken)).not.toHaveBeenCalled();
   });

   it("propagates a failed gateway authentication result", async () => {
      vi.mocked(client.gateway.authenticate).mockResolvedValue({
         authenticated: false,
         retryable: true,
         status: "network_error",
      });

      client.tokenHandler.token = "good-token";
      const result = await client.initialize();

      expect(result).toEqual({ success: false, status: "network_error", retryable: true });
      expect(client.currentUser).toBeUndefined();
   });

   it("defaults retryable to true if the gateway result omits it", async () => {
      vi.mocked(client.gateway.authenticate).mockResolvedValue({
         authenticated: false,
         status: "authentication_failed",
      } as never);

      client.tokenHandler.token = "good-token";
      const result = await client.initialize();

      expect(result).toEqual({ success: false, status: "authentication_failed", retryable: true });
   });

   it("returns authentication_failed if the gateway call throws unexpectedly", async () => {
      vi.mocked(client.gateway.authenticate).mockRejectedValue(new Error("boom"));

      client.tokenHandler.token = "good-token";
      const result = await client.initialize();

      expect(result).toEqual({ success: false, status: "authentication_failed", retryable: false });
   });

   it("does not attempt session restoration when no tokens are passed", async () => {
      vi.mocked(client.gateway.authenticate).mockResolvedValue({
         authenticated: true,
         retryable: true,
         status: "success",
      });

      await client.initialize({ tokens: {} });

      expect(vi.mocked(client.auth.refreshToken)).not.toHaveBeenCalled();
   });
});

// ============================================================
// initialize() - restoring a stored session
// ============================================================

describe("initialize() with stored tokens", () => {
   beforeEach(() => {
      vi.mocked(client.gateway.authenticate).mockResolvedValue({
         authenticated: true,
         retryable: true,
         status: "success",
      });
   });

   it("accepts a still-valid access token without refreshing", async () => {
      const token = futureToken();

      const result = await client.initialize({ tokens: { token } });

      expect(result).toEqual({ success: true, status: "success", retryable: false });
      expect(client.tokenHandler.token).toBe(token);
      expect(vi.mocked(client.auth.refreshToken)).not.toHaveBeenCalled();
   });

   it("refreshes an expired access token using the refresh token", async () => {
      const newTokens = { token: "new-access", refreshToken: "new-refresh" } as unknown as Tokens;
      vi.mocked(client.auth.refreshToken).mockResolvedValue(newTokens);

      const result = await client.initialize({
         tokens: { token: expiredToken(), refreshToken: "old-refresh" },
      });

      expect(vi.mocked(client.auth.refreshToken)).toHaveBeenCalledWith({ refreshToken: "old-refresh" });
      expect(client.tokenHandler.token).toBe("new-access");
      expect(client.tokenHandler.refreshToken).toBe("new-refresh");
      expect(result).toEqual({ success: true, status: "success", retryable: false });
   });

   it("reports invalid_tokens for an expired token with no refresh token", async () => {
      const result = await client.initialize({ tokens: { token: expiredToken() } });

      expect(result).toEqual({ success: false, status: "invalid_tokens", retryable: false });
      expect(vi.mocked(client.gateway.authenticate)).not.toHaveBeenCalled();
   });

   it("reports invalid_tokens for a malformed token with no refresh token", async () => {
      const result = await client.initialize({ tokens: { token: "not-a-jwt" } });

      expect(result).toEqual({ success: false, status: "invalid_tokens", retryable: false });
   });

   it("reports invalid_tokens for a no passed tokens", async () => {
      // vi.mocked(client.auth.refreshToken).mockReturnValue({});
      const result = await client.initialize({});

      expect(result).toEqual({ success: false, status: "invalid_tokens", retryable: false });
   });

   it("clears the session and reports invalid_tokens if refreshing throws a non-network error", async () => {
      vi.mocked(client.auth.refreshToken).mockRejectedValue(new Error("refresh rejected"));
      client.tokenHandler.token = "stale-token";

      const result = await client.initialize({
         tokens: { token: expiredToken(), refreshToken: "old-refresh" },
      });

      expect(result).toEqual({ success: false, status: "invalid_tokens", retryable: false });
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });

   it("reports a retryable network_error if refreshing fails with a fetch-style TypeError", async () => {
      vi.useFakeTimers();
      vi.mocked(client.auth.refreshToken).mockRejectedValue(new TypeError("Failed to fetch"));

      const resultPromise = client.initialize({
         tokens: { token: expiredToken(), refreshToken: "old-refresh" },
      });

      await vi.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;

      expect(result).toEqual({ success: false, status: "network_error", retryable: true });
   });
});

// ============================================================
// login()
// ============================================================

describe("login()", () => {
   const credentials = { email: "a@example.com", password: "hunter2" } as LoginCredentials;

   it("stores the returned tokens on success", async () => {
      const response = { token: "access-1", refreshToken: "refresh-1" } as APIPostLoginResult;
      vi.mocked(client.auth.login).mockResolvedValue(response);

      const result = await client.login(credentials);

      expect(result).toBe(response);
      expect(client.tokenHandler.token).toBe("access-1");
      expect(client.tokenHandler.refreshToken).toBe("refresh-1");
   });

   it("leaves stored tokens untouched if the response has no tokens (e.g. pending email verification)", async () => {
      const response = { pendingEmail: "a@example.com" } as APIPostLoginResult;
      vi.mocked(client.auth.login).mockResolvedValue(response);

      const result = await client.login(credentials);

      expect(result).toBe(response);
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });
});

// ============================================================
// register()
// ============================================================

describe("register()", () => {
   const newUser = { email: "new@example.com", username: "newbie", password: "hunter2" } as RegisterUser;

   it("stores the returned tokens on success", async () => {
      const response = { token: "access-2", refreshToken: "refresh-2" } as APIPostRegisterResult;
      vi.mocked(client.auth.register).mockResolvedValue(response);

      const result = await client.register(newUser);

      expect(result).toBe(response);
      expect(client.tokenHandler.token).toBe("access-2");
      expect(client.tokenHandler.refreshToken).toBe("refresh-2");
   });

   it("leaves stored tokens untouched if the response has no tokens (e.g. pending email verification)", async () => {
      const response = { pendingEmail: "a@example.com" } as APIPostRegisterResult;
      vi.mocked(client.auth.register).mockResolvedValue(response);

      const result = await client.register(newUser);

      expect(result).toBe(response);
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });
});

// ============================================================
// logout()
// ============================================================

describe("logout()", () => {
   it("logs out, then clears the session, closes voice signaling, and closes the gateway", async () => {
      client.tokenHandler.token = "access";
      client.tokenHandler.refreshToken = "refresh";
      setGatewayUser(client, makeUser("u1"));
      vi.mocked(client.gateway.authenticate).mockResolvedValue({ authenticated: true, retryable: true, status: "success" });
      await client.initialize();

      vi.mocked(client.auth.logout).mockResolvedValue(undefined as never);

      await client.logout();

      expect(vi.mocked(client.auth.logout)).toHaveBeenCalledTimes(1);
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
      expect(client.currentUser).toBeUndefined();
      expect(vi.mocked(client.voice.signaling.close)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(client.gateway.close)).toHaveBeenCalledTimes(1);
   });

   it("still cleans up even if the logout request fails", async () => {
      client.tokenHandler.token = "access";
      vi.mocked(client.auth.logout).mockRejectedValue(new Error("network down"));
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await expect(client.logout()).resolves.toBeUndefined();

      expect(client.tokenHandler.token).toBeUndefined();
      expect(vi.mocked(client.gateway.close)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(client.voice.signaling.close)).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
   });
});

// ============================================================
// clearSession()
// ============================================================

describe("clearSession()", () => {
   it("clears tokens and the current user", async () => {
      client.tokenHandler.token = "access";
      client.tokenHandler.refreshToken = "refresh";
      setGatewayUser(client, makeUser("u1"));
      vi.mocked(client.gateway.authenticate).mockResolvedValue({ authenticated: true, retryable: true, status: "success" });
      await client.initialize();
      expect(client.currentUser).toBeDefined();

      client.clearSession();

      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
      expect(client.currentUser).toBeUndefined();
   });
});

// ============================================================
// generateNonce()
// ============================================================

describe("generateNonce()", () => {
   it("returns a non-empty, unique snowflake string on each call", () => {
      const first = client.generateNonce();
      const second = client.generateNonce();

      expect(typeof first).toBe("string");
      expect(first.length).toBeGreaterThan(0);
      expect(first).not.toBe(second);
   });
});

// ============================================================
// checkUser()
// ============================================================

describe("checkUser()", () => {
   it("throws when there is no current user", () => {
      expect(() => client.checkUser()).toThrow("Client user is null");
   });

   it("does not throw once a user is set", async () => {
      setGatewayUser(client, makeUser("u1"));
      vi.mocked(client.gateway.authenticate).mockResolvedValue({ authenticated: true, retryable: true, status: "success" });
      client.tokenHandler.token = "good-token";
      await client.initialize();

      expect(() => client.checkUser()).not.toThrow();
   });
});

// ============================================================
// validateAccessToken()
// ============================================================

describe("validateAccessToken()", () => {
   it("returns false for a missing token", async () => {
      const result = await client.validateAccessToken(undefined);
      expect(result).toBe(false);
   });

   it("returns false when a token didn't have exp", async () => {
      const result = await client.validateAccessToken(makeJwt({}));
      expect(result).toBe(false);
   });
});
