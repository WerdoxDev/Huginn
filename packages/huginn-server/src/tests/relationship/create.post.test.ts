import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { RelationshipType } from "@huginn/shared";
import { authHeader, createTestRelationships, createTestUsers } from "#tests/utils";

describe("POST /users/@me/relationships", () => {
	test("should return 'Invalid Form Body' when body constrains are not met", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", {});
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", { username: "" });
		expect(result2).rejects.toThrow("Invalid Form Body");
	});

	test("should return 'Unauthorized' when no token is passed", async () => {
		// It's good to make sure the data is real and only not authenticated
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/users/@me/relationships", {}, "POST", { username: user.username });
		expect(result).rejects.toThrow("Unauthorized");
	});

	test("should return '... to self' when the user tries to create a friend request to itself", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", { username: user.username });
		expect(result).rejects.toThrow("to self");
	});

	test("should create a relationship with a user's username when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", { username: user2.username });
		expect(result).resolves.toBe(undefined);
	});

	test("should create a relationship with a user's id when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "PUT");
		expect(result).resolves.toBe(undefined);
	});

	test("should convert a relationship to type 1 (friend) when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		await createTestRelationships(user.id, user2.id);

		const result = testHandler("/api/users/@me/relationships", authHeader(user2.accessToken), "POST", { username: user.username });
		expect(result).resolves.toBe(undefined);

		const exists = await prisma.relationship.exists({ ownerId: user.id, userId: user2.id, type: RelationshipType.FRIEND });
		const exists2 = await prisma.relationship.exists({ ownerId: user2.id, userId: user.id, type: RelationshipType.FRIEND });
		expect(exists && exists2).toBeTrue();
	});
});
