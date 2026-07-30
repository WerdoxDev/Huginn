import type { APIGetCurrentUserResult } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";

import { expectUserExactSchema } from "#tests/expect-utils";
import { authHeader, createTestUsers } from "#tests/utils";

describe("GET /users/@me", () => {
   test("should return 'Unauthorized' when no token is passed", async () => {
      await createTestUsers(1);

      // No token
      const result = testHandler("/api/users/@me", {}, "GET");
      expect(result).rejects.toThrow("Unauthorized");
   });

   test("should return the current user from a token when the request is successful", async () => {
      const [user] = await createTestUsers(1);

      const result = (await testHandler("/api/users/@me", authHeader(user.accessToken), "GET")) as APIGetCurrentUserResult;

      expectUserExactSchema(result, user);
   });
});
