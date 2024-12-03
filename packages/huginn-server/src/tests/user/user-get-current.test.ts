import { describe, expect, test } from "bun:test";
import { authHeader, createTestUsers, testHandler } from "#tests/utils";

describe("user-get-current", () => {
	test("successful", async () => {
		const [user] = await createTestUsers(1);

		const result = await testHandler("/api/users/@me", authHeader(user.accessToken), "GET");

		expect(result).toBeDefined();
		expect(result).toHaveProperty("email");
		expect(result).toHaveProperty("password");
	});
});
