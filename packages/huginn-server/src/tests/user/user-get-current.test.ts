import { afterEach, describe, expect, test } from "bun:test";
import { authHeader, createTestUser, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("user-get-current", () => {
	test("successful", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");

		const result = await testHandler("/api/users/@me", authHeader(user.accessToken), "GET");

		expect(result).toBeDefined();
		expect(result).toHaveProperty("email");
		expect(result).toHaveProperty("password");
	});
});
