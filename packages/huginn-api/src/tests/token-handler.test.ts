import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { HuginnClient } from "../huginn-client";

import { TokenHandler } from "../token-handler";

async function accessToken(expiresAt: number): Promise<string> {
   return new SignJWT({ id: "123", sessionId: "session", authType: "password", lastAuthenticatedAt: Date.now() })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expiresAt)
      .sign(new TextEncoder().encode("test-secret"));
}

describe("TokenHandler", () => {
   afterEach(() => {
      vi.useRealTimers();
   });

   it("rotates and publishes both tokens before the access token expires", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const initial = await accessToken(Math.floor(Date.now() / 1000) + 3);
      const replacement = await accessToken(Math.floor(Date.now() / 1000) + 30);
      const refreshToken = vi.fn().mockResolvedValue({ token: replacement, refreshToken: "next-refresh" });
      const handler = new TokenHandler({ auth: { refreshToken } } as unknown as HuginnClient);
      const onChange = vi.fn();
      handler.onChange(onChange);

      handler.refreshToken = "first-refresh";
      handler.token = initial;
      await vi.advanceTimersByTimeAsync(2000);

      expect(refreshToken).toHaveBeenCalledWith({ refreshToken: "first-refresh" });
      expect(handler.token).toBe(replacement);
      expect(handler.refreshToken).toBe("next-refresh");
      expect(onChange).toHaveBeenLastCalledWith(replacement, "next-refresh");
   });
});
