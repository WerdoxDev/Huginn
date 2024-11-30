import { afterEach, describe, expect, test } from "bun:test";
import { authHeader, createTestRelationships, createTestUser, removeUsers, resolveAll, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("relationship-delete", () => {
	test("invalid", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const result = testHandler("/api/users/@me/relationships/invalid", authHeader(user.accessToken), "DELETE");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/@me/relationships/000000000000000000", authHeader(user.accessToken), "DELETE");
		expect(result2).rejects.toThrow("Unknown Relationship"); // Unknown id

		// Valid user but no relationships between them
		const result3 = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
		expect(result3).rejects.toThrow("Unknown Relationship");
	});
	test("successful", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		await createTestRelationships(user.id, user2.id, true);

		const result = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
		expect(result).resolves.toBe(undefined);
	});
});
