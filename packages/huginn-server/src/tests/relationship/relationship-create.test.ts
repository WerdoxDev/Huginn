import { afterEach, describe, expect, test } from "bun:test";
import { RelationshipType } from "@huginn/shared";
import { prisma } from "#database";
import { authHeader, createTestRelationships, createTestUser, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("relationship-create", () => {
	test("invalid", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");

		const result = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", {});
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", { username: "" });
		expect(result2).rejects.toThrow("Invalid Form Body");
	});

	test("unauthorized", async () => {
		// It's good to make sure the data is real and only not authenticated
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const result = testHandler("/api/users/@me/relationships", {}, "POST", { username: user2.username });
		expect(result).rejects.toThrow("Unauthorized");
	});

	test("request self", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");

		const result = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", { username: user.username });
		expect(result).rejects.toThrow("to self");
	});

	test("with username", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const result = testHandler("/api/users/@me/relationships", authHeader(user.accessToken), "POST", { username: user2.username });
		expect(result).resolves.toBe(undefined);
	});

	test("with user id", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const result = testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "PUT");
		expect(result).resolves.toBe(undefined);
	});

	test("accept", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		await createTestRelationships(user.id, user2.id);

		const result = testHandler("/api/users/@me/relationships", authHeader(user2.accessToken), "POST", { username: user.username });
		expect(result).resolves.toBe(undefined);

		const exists = await prisma.relationship.exists({ ownerId: user.id, userId: user2.id, type: RelationshipType.FRIEND });
		const exists2 = await prisma.relationship.exists({ ownerId: user2.id, userId: user.id, type: RelationshipType.FRIEND });
		expect(exists && exists2).toBeTrue();
	});
});
