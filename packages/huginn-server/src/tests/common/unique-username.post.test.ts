import { describe, expect, test } from "bun:test";
import type { APIPostUniqueUsernameResult } from "@huginn/shared";
import { createTestUsers, testHandler } from "#tests/utils";

describe("POST /unique-username", () => {
	test("should return a true taken property when the username is taken", async () => {
		const [user] = await createTestUsers(1);

		const result = (await testHandler("/api/unique-username", {}, "POST", { username: user.username })) as APIPostUniqueUsernameResult;
		expect(result.taken).toBeTrue();
	});

	test("should return a false taken property when the username is free", async () => {
		const result = (await testHandler("/api/unique-username", {}, "POST", { username: "not-taken" })) as APIPostUniqueUsernameResult;
		expect(result.taken).toBeFalse();
	});
});
