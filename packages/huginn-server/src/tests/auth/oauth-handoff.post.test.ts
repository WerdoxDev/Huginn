import type { APIPostOAuthHandoffResult } from "@huginnjs/shared";

import { testHandler, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import { createTestUsers } from "#tests/utils";
import { createOAuthHandoff } from "#utils/oauth-handoff";

describe("POST /auth/oauth-handoff", () => {
   test("exchanges a code for a session exactly once", async () => {
      const [user] = await createTestUsers(1);
      const code = await createOAuthHandoff(user.id.toString());

      const result = (await testHandler("/api/auth/oauth-handoff", {}, "POST", { code })) as APIPostOAuthHandoffResult;
      const access = await verifyToken("user-access", result.token);
      const refresh = await verifyToken("user-refresh", result.refreshToken);

      expect(access.valid).toBe(true);
      expect(access.payload?.id).toBe(user.id.toString());
      expect(refresh.valid).toBe(true);
      expect(refresh.payload?.sessionId).toBe(access.payload?.sessionId);
      await expect(testHandler("/api/auth/oauth-handoff", {}, "POST", { code })).rejects.toThrow("Unauthorized");
   });

   test("rejects expired and malformed codes", async () => {
      const [user] = await createTestUsers(1);
      const code = await createOAuthHandoff(user.id.toString());
      const codeHash = createHash("sha256").update(code).digest("hex");
      await prisma.oAuthHandoff.update({ where: { codeHash }, data: { expiresAt: new Date(0) } });

      await expect(testHandler("/api/auth/oauth-handoff", {}, "POST", { code })).rejects.toThrow("Unauthorized");
      await expect(testHandler("/api/auth/oauth-handoff", {}, "POST", { code: "invalid" })).rejects.toThrow("Unauthorized");
   });

   test("allows only one concurrent exchange", async () => {
      const [user] = await createTestUsers(1);
      const code = await createOAuthHandoff(user.id.toString());
      const attempts = await Promise.allSettled([
         testHandler("/api/auth/oauth-handoff", {}, "POST", { code }),
         testHandler("/api/auth/oauth-handoff", {}, "POST", { code }),
      ]);

      expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
      expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
   });
});
