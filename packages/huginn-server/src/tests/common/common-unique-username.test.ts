import { describe, expect, test } from "bun:test";
import type { APIPostUniqueUsernameResult } from "@huginn/shared";
import { createTestUsers, testHandler } from "#tests/utils";

describe("common-unique-username", () => {
	test("username taken", async () => {
		const [user] = await createTestUsers(1);

		const result = (await testHandler("/api/unique-username", {}, "POST", { username: user.username })) as APIPostUniqueUsernameResult;
		expect(result.taken).toBeTrue();
	});

	test("username free", async () => {
		const [user] = await createTestUsers(1);

		const result = (await testHandler("/api/unique-username", {}, "POST", { username: "not-taken" })) as APIPostUniqueUsernameResult;
		expect(result.taken).toBeFalse();
	});
});
