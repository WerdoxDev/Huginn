import { testHandler, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { snowflake, WorkerID } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";
import { createAuthSession } from "#utils/auth-session";

const route = "/api/users/@me/auth-methods/google";

describe("OAuth provider connections", () => {
   test("only an authenticated user can start or remove a connection", async () => {
      await expect(testHandler(`${route}/connect`, {}, "POST")).rejects.toThrow("Unauthorized");
      await expect(testHandler(route, {}, "DELETE")).rejects.toThrow("Unauthorized");
   });

   test("issues a session-bound link token and accepts it for Google authorization", async () => {
      const [user] = await createTestUsers(1);
      const result = (await testHandler(`${route}/connect`, authHeader(user.accessToken), "POST")) as { linkToken: string };
      const verified = await verifyToken("oauth-link", result.linkToken);

      expect(verified.valid).toBe(true);
      expect(verified.payload?.userId).toBe(user.id.toString());
      expect(verified.payload?.purpose).toBe("connect-google");

      const query = new URLSearchParams({
         flow: "browser",
         redirect_url: "https://app.huginn.dev/",
         link_token: result.linkToken,
      });
      const response = (await testHandler(`/api/auth/google?${query}`, {}, "GET")) as Response;
      expect(response.status).toBe(302);
      expect(new URL(response.headers.get("location")!).origin).toBe("https://accounts.google.com");

      query.set("link_token", "invalid");
      const invalidResponse = (await testHandler(`/api/auth/google?${query}`, {}, "GET")) as Response;
      expect(new URL(invalidResponse.headers.get("location")!).searchParams.get("error")).toBe("LINK_EXPIRED");
   });

   test("does not remove the only usable sign-in method", async () => {
      const [user] = await createTestUsers(1);
      const identityId = snowflake.generate(WorkerID.TESTING);
      await prisma.identityProvider.create({
         data: { id: identityId, userId: user.id, providerType: "google", providerUserId: `google-${user.id}`, completed: true },
      });

      try {
         await expect(testHandler(`${route}/connect`, authHeader(user.accessToken), "POST")).rejects.toThrow("already connected");

         await prisma.user.update({ where: { id: user.id }, data: { password: null } });
         await expect(testHandler(route, authHeader(user.accessToken), "DELETE")).rejects.toThrow("last sign-in method");
         expect(await prisma.identityProvider.findUnique({ where: { id: identityId } })).not.toBeNull();

         await prisma.user.update({ where: { id: user.id }, data: { password: await Bun.password.hash("new-password") } });
         await testHandler(route, authHeader(user.accessToken), "DELETE");
         expect(await prisma.identityProvider.findUnique({ where: { id: identityId } })).toBeNull();
      } finally {
         await prisma.identityProvider.deleteMany({ where: { id: identityId } });
      }
   });

   test("does not remove a password before another sign-in method is connected", async () => {
      const [user] = await createTestUsers(1);
      await expect(testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", { newPassword: null, password: user.password })).rejects.toThrow(
         "last sign-in method",
      );
      expect((await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } }))?.password).not.toBeNull();
   });

   test("disconnecting Google revokes Google sessions while leaving password sessions active", async () => {
      const [user] = await createTestUsers(1);
      const identityId = snowflake.generate(WorkerID.TESTING);
      await prisma.identityProvider.create({
         data: { id: identityId, userId: user.id, providerType: "google", providerUserId: `google-${user.id}`, completed: true },
      });

      const googleSession = await createAuthSession(user.id.toString(), "oauth", "google");
      const refreshed = (await testHandler("/api/auth/refresh-token", {}, "POST", {
         refreshToken: googleSession.refreshToken,
      })) as { token: string; refreshToken: string };
      const refreshedToken = await verifyToken("user-access", refreshed.token);
      expect(refreshedToken.payload?.authProvider).toBe("google");

      await testHandler(route, authHeader(refreshed.token), "DELETE");

      const sessions = await prisma.authSession.findMany({ where: { userId: user.id }, select: { authType: true, authProvider: true, revokedAt: true } });
      expect(sessions.find((session) => session.authType === "oauth")?.authProvider).toBe("google");
      expect(sessions.find((session) => session.authType === "oauth")?.revokedAt).not.toBeNull();
      expect(sessions.find((session) => session.authType === "password")?.revokedAt).toBeNull();
      await expect(testHandler("/api/users/@me/auth-methods", authHeader(refreshed.token), "GET")).rejects.toThrow("Unauthorized");
      await testHandler("/api/users/@me/auth-methods", authHeader(user.accessToken), "GET");
   });

   test("removing the password revokes every active session", async () => {
      const [user] = await createTestUsers(1);
      const identityId = snowflake.generate(WorkerID.TESTING);
      await prisma.identityProvider.create({
         data: { id: identityId, userId: user.id, providerType: "google", providerUserId: `google-${user.id}`, completed: true },
      });
      const googleSession = await createAuthSession(user.id.toString(), "oauth", "google");

      await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", { newPassword: null, password: user.password });

      expect((await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } }))?.password).toBeNull();
      const sessions = await prisma.authSession.findMany({ where: { userId: user.id }, select: { revokedAt: true } });
      expect(sessions).toHaveLength(2);
      expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);
      await expect(testHandler("/api/users/@me/auth-methods", authHeader(googleSession.token), "GET")).rejects.toThrow("Unauthorized");
   });
});
