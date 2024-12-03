import { describe, expect, test } from "bun:test";
import type { APIPostRefreshTokenResult } from "@huginn/shared";
import { createTestUsers, testHandler } from "#tests/utils";

describe("auth-refresh-token", () => {
	test("unauthorized", async () => {
		const refreshToken = "invalid token";
		const result = testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken });

		expect(result).rejects.toThrow("Unauthorized");
	});
	test("successful", async () => {
		const [user] = await createTestUsers(1);

		const refreshToken = user.refreshToken;
		const result = (await testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken })) as APIPostRefreshTokenResult;

		expect(result.token).toBeDefined();
		expect(result.refreshToken).toBeDefined();
	});
});
