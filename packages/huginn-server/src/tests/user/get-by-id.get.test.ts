import { describe, expect, test } from "bun:test";
import type { APIGetUserByIdResult } from "@huginn/shared";
import { expectPrivateUserExactSchema, expectUserExactSchema } from "#tests/expect-utils";
import { authHeader, createTestUsers, testHandler } from "#tests/utils";

describe("GET /users/:userId", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/users/invalid", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/000000000000000000", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown User"); // Unknown id
	});
	test("should return 'Unauthorized' when no token is passed", async () => {
		// To be sure that the userId is valid
		const [user] = await createTestUsers(1);

		// No token
		const result = testHandler(`/api/users/${user.id}`, {}, "GET");
		expect(result).rejects.toThrow("Unauthorized");
	});
	test("should return a user with its id when the request is successful", async () => {
		const [user] = await createTestUsers(1);

		const result = (await testHandler(`/api/users/${user.id}`, authHeader(user.accessToken), "GET")) as APIGetUserByIdResult;
		expectUserExactSchema(result, user.id, user.username, user.displayName, user.avatar, user.flags);
	});
});
