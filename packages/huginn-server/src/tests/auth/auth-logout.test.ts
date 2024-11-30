import { afterEach, describe, expect, test } from "bun:test";
import { authHeader, createTestUser, removeUsers, testHandler } from "#tests/utils";
import { verifyToken } from "#utils/token-factory";

afterEach(async () => {
	await removeUsers();
});

describe("auth-logout", () => {
	test("success", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const token = user.accessToken;

		await testHandler("/api/auth/logout", authHeader(token), "POST");

		const { valid, payload } = await verifyToken(token);

		expect(valid).toBeFalse();
		expect(payload).toBeFalsy();
	});
});
