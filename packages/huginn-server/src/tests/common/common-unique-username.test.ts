import { afterEach, describe, expect, test } from "bun:test";
import type { APIPostUniqueUsernameResult } from "@huginn/shared";
import { createTestUser, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("common-unique-username", () => {
	test("username taken", async () => {
		await createTestUser("test", "test", "test@gmail.com", "test");

		const result = (await testHandler("/api/unique-username", {}, "POST", { username: "test" })) as APIPostUniqueUsernameResult;
		expect(result.taken).toBeTrue();
	});

	test("username free", async () => {
		await createTestUser("test", "test", "test@gmail.com", "test");

		const result = (await testHandler("/api/unique-username", {}, "POST", { username: "not-taken" })) as APIPostUniqueUsernameResult;
		expect(result.taken).toBeFalse();
	});
});
