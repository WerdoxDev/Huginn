import { describe, expect, test } from "bun:test";
import type { APIGetUserRelationshipByIdResult, APIGetUserRelationshipsResult } from "@huginn/shared";
import { authHeader, createTestRelationships, createTestUsers, testHandler } from "#tests/utils";

describe("relationship-get", () => {
	test("invalid", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/relationships/invalid", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/@me/relationships/000000000000000000", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Relationship"); // Unknown id

		// Valid user but no relationship between them
		const result3 = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "GET");
		expect(result3).rejects.toThrow("Unknown Relationship");
	});
	test("get all", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		await createTestRelationships(user.id, user2.id, true);
		await createTestRelationships(user.id, user3.id, true);

		const result = (await testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "GET")) as APIGetUserRelationshipsResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(2);
	});
	test("get by id", async () => {
		const [user, user2] = await createTestUsers(2);

		const [userRelationship] = await createTestRelationships(user.id, user2.id, true);

		const result = (await testHandler(
			`/api/users/@me/relationships/${user2.id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetUserRelationshipByIdResult;

		expect(result?.id).toBe(userRelationship.id.toString());
		expect(result.user.id).toBe(user2.id.toString());
	});
});
