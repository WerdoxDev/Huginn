import { testHandler, verifyToken } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";

describe("POST /auth/logout", () => {
   test.skip("should invalidate the user's token", async () => {
      const [user] = await createTestUsers(1);
      const token = user.accessToken;

      await testHandler("/api/auth/logout", authHeader(token), "POST");

      const { valid, payload } = await verifyToken("user-access", token);

      expect(valid).toBeFalse();
      expect(payload).toBeFalsy();
   });
});
