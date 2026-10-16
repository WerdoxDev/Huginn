import { testHandler, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { snowflake, WorkerID } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";
import { createAuthSession } from "#utils/auth-session";
import { hashPasswordResetCode } from "#utils/password-reset";

async function putCode(userId: bigint, code: string, expiresAt = new Date(Date.now() + 60_000)) {
   await prisma.passwordReset.upsert({
      where: { userId },
      create: { id: snowflake.generate(WorkerID.PASSWORD_RESET), userId, codeHash: hashPasswordResetCode(userId.toString(), code), expiresAt },
      update: { codeHash: hashPasswordResetCode(userId.toString(), code), expiresAt },
   });
}

describe("password reset", () => {
   test("uses the same public response for an unknown email", async () => {
      const response = (await testHandler("/api/auth/password-reset/request", {}, "POST", { email: "unknown-reset@example.com" }, true)) as Response;
      expect(response.status).toBe(202);
      expect(await response.json()).toEqual({ message: "If this account can reset its password, a code has been sent." });
   });

   test("anonymous reset revokes password sessions but preserves OAuth sessions", async () => {
      const [user] = await createTestUsers(1);
      const oauthSession = await createAuthSession(user.id.toString(), "oauth", "google");
      await putCode(user.id, "123456");

      const body = { email: user.email, code: "123456", newPassword: "a-new-password" };
      const response = (await testHandler("/api/auth/password-reset/complete", {}, "POST", body, true)) as Response;
      expect(response.status).toBe(204);
      expect(await prisma.passwordReset.findUnique({ where: { userId: user.id } })).toBeNull();
      expect(await Bun.password.verify(body.newPassword, (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).password!)).toBe(true);
      await expect(testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken: user.refreshToken })).rejects.toThrow("Unauthorized");
      expect((await verifyToken("user-access", oauthSession.token)).valid).toBe(true);
      await expect(testHandler("/api/auth/password-reset/complete", {}, "POST", body)).rejects.toThrow();
   });

   test("signed-in reset keeps the current session and revokes other password sessions", async () => {
      const [user] = await createTestUsers(1);
      const otherPasswordSession = await createAuthSession(user.id.toString(), "password");
      const oauthSession = await createAuthSession(user.id.toString(), "oauth", "google");
      await putCode(user.id, "223344");

      const response = (await testHandler(
         "/api/auth/password-reset/complete",
         authHeader(user.accessToken),
         "POST",
         { email: user.email, code: "223344", newPassword: "a-new-password" },
         true,
      )) as Response;

      expect(response.status).toBe(204);
      expect((await verifyToken("user-access", user.accessToken)).valid).toBe(true);
      expect((await verifyToken("user-access", otherPasswordSession.token)).valid).toBe(false);
      expect((await verifyToken("user-access", oauthSession.token)).valid).toBe(true);
   });

   test("rejects a signed-in session from a different account", async () => {
      const [user, otherUser] = await createTestUsers(2);
      await putCode(user.id, "334455");

      await expect(
         testHandler("/api/auth/password-reset/complete", authHeader(otherUser.accessToken), "POST", {
            email: user.email,
            code: "334455",
            newPassword: "a-new-password",
         }),
      ).rejects.toThrow("Unauthorized");
      expect(await prisma.passwordReset.findUnique({ where: { userId: user.id } })).not.toBeNull();
   });

   test("keeps a valid code usable after wrong guesses", async () => {
      const [user] = await createTestUsers(1);
      await putCode(user.id, "654321");
      for (let attempt = 0; attempt < 5; attempt++) {
         await expect(
            testHandler("/api/auth/password-reset/complete", {}, "POST", { email: user.email, code: "000000", newPassword: "new-password" }),
         ).rejects.toThrow();
      }
      const response = (await testHandler(
         "/api/auth/password-reset/complete",
         {},
         "POST",
         { email: user.email, code: "654321", newPassword: "new-password" },
         true,
      )) as Response;
      expect(response.status).toBe(204);
   });

   test("uses the same request endpoint for a signed-in user", async () => {
      const [user] = await createTestUsers(1);
      const response = (await testHandler("/api/auth/password-reset/request", authHeader(user.accessToken), "POST", { email: user.email }, true)) as Response;
      expect(response.status).toBe(202);
      expect(await response.json()).toEqual({ message: "If this account can reset its password, a code has been sent." });
   });
});
