import { describe, expect, test } from "bun:test";
import type { APIGetUserByIdResult } from "@huginn/shared";
import { authHeader, createTestUsers, testHandler } from "#tests/utils";

describe("user-get-by-id", () => {
	test("unauthorized", async () => {
		// To be sure that the userId is valid
		const [user] = await createTestUsers(1);

		const result = testHandler(`/api/users/${user.id}`, {}, "GET");

		expect(result).rejects.toThrow("Unauthorized");
	});
	test("invalid", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/users/invalid", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/000000000000000000", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown User"); // Unknown id
	});
	test("successful", async () => {
		const [user] = await createTestUsers(1);

		const result = (await testHandler(`/api/users/${user.id}`, authHeader(user.accessToken), "GET")) as APIGetUserByIdResult;

		expect(result?.id).toBe(user.id.toString());
		expect(result).not.toHaveProperty("email");
		expect(result).not.toHaveProperty("password");
	});
});
