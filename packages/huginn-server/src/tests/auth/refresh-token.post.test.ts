import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import type { APIPostRefreshTokenResult } from "@huginn/shared";
import { createTestUsers } from "#tests/utils";

describe("POST /auth/refresh-token", () => {
	test("should return 'Unauthorized' when invalid token is passed", async () => {
		const refreshToken = "invalid token";
		const result = testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken });

		expect(result).rejects.toThrow("Unauthorized");
	});
	test("should return a token and a new refreshToken when the request is successful", async () => {
		const [user] = await createTestUsers(1);

		const refreshToken = user.refreshToken;
		const result = (await testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken })) as APIPostRefreshTokenResult;

		expect(result.token).toBeDefined();
		expect(result.refreshToken).toBeDefined();
	});
});
