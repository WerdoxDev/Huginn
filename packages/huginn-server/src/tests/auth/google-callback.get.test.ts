import { testHandler } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";

describe("GET /auth/callback/google", () => {
   test("should return 'Forbidden' when session state is not valid", async () => {
      const result = testHandler("/api/auth/callback/google", {}, "GET");
      expect(result).rejects.toThrow("Invalid Form Body");
   });
});
