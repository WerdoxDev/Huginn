import { afterEach, describe, expect, test } from "bun:test";
import type { APIPostRefreshTokenResult } from "@huginn/shared";
import { createTestUser, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("auth-refresh-token", () => {
	test("unauthorized", async () => {
		const refreshToken = "invalid token";
		const result = testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken });

		expect(result).rejects.toThrow("Unauthorized");
	});
	test("successful", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");

		const refreshToken = user.refreshToken;
		const result = (await testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken })) as APIPostRefreshTokenResult;

		expect(result.token).toBeDefined();
		expect(result.refreshToken).toBeDefined();
	});
});
