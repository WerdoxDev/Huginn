import { describe, expect, test } from "bun:test";
import { type APIGetUserRelationshipByIdResult, type APIGetUserRelationshipsResult, RelationshipType } from "@huginn/shared";
import { expectRelationshipExactSchema } from "#tests/expect-utils";
import { authHeader, createTestRelationships, createTestUsers, testHandler } from "#tests/utils";

describe("GET /users/@me/relationships/:userId", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/relationships/invalid", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/users/@me/relationships/000000000000000000", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Relationship"); // Unknown id

		// Valid user but no relationship between them
		const result3 = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "GET");
		expect(result3).rejects.toThrow("Unknown Relationship");
	});
	test("should return a relationship when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const [relationship] = await createTestRelationships(user.id, user2.id, true);

		const result = (await testHandler(
			`/api/users/@me/relationships/${user2.id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetUserRelationshipByIdResult;

		expectRelationshipExactSchema(result, RelationshipType.FRIEND, relationship.id, user2);
	});
});
