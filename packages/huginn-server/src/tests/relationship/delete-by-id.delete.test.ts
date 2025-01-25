import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { authHeader, createTestRelationships, createTestUsers } from "#tests/utils";

describe("DELETE /users/@me/relationships/:userId", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/relationships/invalid", authHeader(user.accessToken), "DELETE");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/@me/relationships/000000000000000000", authHeader(user.accessToken), "DELETE");
		expect(result2).rejects.toThrow("Unknown Relationship"); // Unknown id

		// Valid user but no relationships between them
		const result3 = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
		expect(result3).rejects.toThrow("Unknown Relationship");
	});
	test("should return 'Unauthorized' when no token is passed", async () => {
		const [user, user2] = await createTestUsers(3);

		await createTestRelationships(user.id, user2.id, true);

		// No token
		const result = testHandler(`/api/users/@me/relationships/${user2.id}`, {}, "DELETE");
		expect(result).rejects.toThrow("Unauthorized");
	});
	test("should delete a relationship between two users when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		await createTestRelationships(user.id, user2.id, true);

		const result = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
		expect(result).resolves.toBe(undefined);
	});
});
