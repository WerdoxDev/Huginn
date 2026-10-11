import type { APIGetAuthMethodsResult } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { snowflake, WorkerID } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";

describe("GET /users/@me/auth-methods", () => {
   test("requires a user token", async () => {
      expect(testHandler("/api/users/@me/auth-methods", {}, "GET")).rejects.toThrow("Unauthorized");
   });

   test("reports credentials from the account, including completed providers only", async () => {
      const [user] = await createTestUsers(1);
      const googleId = snowflake.generate(WorkerID.TESTING);
      const incompleteId = snowflake.generate(WorkerID.TESTING);
      await prisma.identityProvider.createMany({
         data: [
            { id: googleId, userId: user.id, providerType: "google", providerUserId: `google-${user.id}`, refreshToken: "", completed: true },
            { id: incompleteId, userId: user.id, providerType: "github", providerUserId: `github-${user.id}`, refreshToken: "", completed: false },
         ],
      });

      try {
         const result = (await testHandler("/api/users/@me/auth-methods", authHeader(user.accessToken), "GET")) as APIGetAuthMethodsResult;
         expect(result.password.configured).toBe(true);
         expect(result.providers.find((provider) => provider.type === "google")?.connected).toBe(true);
         expect(result.providers.find((provider) => provider.type === "github")?.connected).toBe(false);

         await prisma.user.update({ where: { id: user.id }, data: { password: null } });
         const withoutPassword = (await testHandler("/api/users/@me/auth-methods", authHeader(user.accessToken), "GET")) as APIGetAuthMethodsResult;
         expect(withoutPassword.password.configured).toBe(false);
      } finally {
         await prisma.identityProvider.deleteMany({ where: { id: { in: [googleId, incompleteId] } } });
      }
   });
});
