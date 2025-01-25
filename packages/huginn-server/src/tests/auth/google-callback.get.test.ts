import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";

describe("GET /auth/callback/google", () => {
	test("should return 'Forbidden' when session state is not valid", async () => {
		const result = testHandler("/api/auth/callback/google", {}, "GET");
		expect(result).rejects.toThrow("Forbidden");
	});
});
