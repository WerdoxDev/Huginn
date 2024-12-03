import { describe, expect, test } from "bun:test";
import { authHeader, createTestRelationships, createTestUsers, testHandler } from "#tests/utils";

describe("relationship-delete", () => {
	test("invalid", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/relationships/invalid", authHeader(user.accessToken), "DELETE");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/@me/relationships/000000000000000000", authHeader(user.accessToken), "DELETE");
		expect(result2).rejects.toThrow("Unknown Relationship"); // Unknown id

		// Valid user but no relationships between them
		const result3 = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
		expect(result3).rejects.toThrow("Unknown Relationship");
	});
	test("successful", async () => {
		const [user, user2] = await createTestUsers(2);

		await createTestRelationships(user.id, user2.id, true);

		const result = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
		expect(result).resolves.toBe(undefined);
	});
});
