import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { describe, expect, test } from "bun:test";

import { createTestUsers } from "#tests/utils";
import { hashEmailVerificationCode, issueEmailVerificationCode } from "#utils/email-verification";

describe("email verification codes", () => {
   test("stores a hash and accepts only the matching code", async () => {
      const [user] = await createTestUsers(1);
      const email = `${user.username}-changed@example.com`;

      const code = await issueEmailVerificationCode(user.id.toString(), email, "email_change");

      const stored = await prisma.emailVerification.findUniqueOrThrow({ where: { userId: user.id } });
      expect(stored.codeHash).toBe(hashEmailVerificationCode(user.id.toString(), code));
      expect(stored.codeHash).not.toBe(code);

      await expect(testHandler("/api/users/@me/verify-email", {}, "POST", { email, code: "000000" })).rejects.toThrow();
      expect(await prisma.emailVerification.findUnique({ where: { userId: user.id } })).not.toBeNull();

      const response = (await testHandler("/api/users/@me/verify-email", {}, "POST", { email, code }, true)) as Response;
      expect(response.status).toBe(200);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(email);
      expect(await prisma.emailVerification.findUnique({ where: { userId: user.id } })).toBeNull();
      await expect(testHandler("/api/users/@me/verify-email", {}, "POST", { email, code })).rejects.toThrow();
   });
});
