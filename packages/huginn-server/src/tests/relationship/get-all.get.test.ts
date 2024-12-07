import { describe, expect, test } from "bun:test";
import { type APIGetUserRelationshipsResult, RelationshipType } from "@huginn/shared";
import { expectRelationshipExactSchema } from "#tests/expect-utils";
import { authHeader, createTestRelationships, createTestUsers, testHandler } from "#tests/utils";

describe("GET /users/@me/relationships", () => {
	test("should return 'Unauthorized' when no token is passed", async () => {
		const [user, user2] = await createTestUsers(3);

		await createTestRelationships(user.id, user2.id, true);

		// No token
		const result = testHandler("/api/users/@me/relationships", {}, "GET");
		expect(result).rejects.toThrow("Unauthorized");
	});

	test("should return all of user's relationships when the request is successful", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const [relationship] = await createTestRelationships(user.id, user2.id, true);
		const [relationship2] = await createTestRelationships(user.id, user3.id, false);

		const result = (await testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "GET")) as APIGetUserRelationshipsResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(2);

		expectRelationshipExactSchema(result[0], RelationshipType.FRIEND, relationship.id, user2);
		expectRelationshipExactSchema(result[1], RelationshipType.PENDING_OUTGOING, relationship2.id, user3);
	});
});
