import { describe, expect, test } from "bun:test";
import type { APIPostDMChannelResult, Snowflake } from "@huginn/shared";
import type { APIChannelUser } from "@huginn/shared";
import { authHeader, createTestUsers, removeChannelLater, testHandler } from "#tests/utils";

describe("channel-create-dm", () => {
	test("invalid", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {}).then(removeChannelLater);
		expect(result).rejects.toThrow("Invalid Form Body"); // Invalid

		const result2 = testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", { recipients: [] }).then(removeChannelLater);
		expect(result2).rejects.toThrow("Invalid Form Body"); // Invalid id

		const result3 = testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", { recipients: ["000000000000000000"] }).then(
			removeChannelLater,
		);
		expect(result3).rejects.toThrow(`Unknown User (${user.id},000000000000000000)`); // Unknown id
	});
	test("unauthorized", async () => {
		const [_user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/channels", {}, "POST", { recipients: [user2.id.toString()] }).then(removeChannelLater);
		expect(result).rejects.toThrow("Unauthorized");
	});
	test("single dm", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
			recipients: [user2.id.toString()],
		}).then(removeChannelLater)) as APIPostDMChannelResult;

		expect(containsId(result.recipients, user2.id.toString())).toBe(true);
	});
	test("group dm", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
			recipients: [user2.id.toString(), user3.id.toString()],
		}).then(removeChannelLater)) as APIPostDMChannelResult;

		expect(result.ownerId).toBe(user.id.toString());
		expect(containsId(result.recipients, user2.id.toString())).toBe(true);
		expect(containsId(result.recipients, user3.id.toString())).toBe(true);
	});
	test("group dm with name", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
			recipients: [user2.id.toString(), user3.id.toString()],
			name: "test_group",
		}).then(removeChannelLater)) as APIPostDMChannelResult;

		expect(result.ownerId).toBe(user.id.toString());
		expect(containsId(result.recipients, user2.id.toString())).toBe(true);
		expect(containsId(result.recipients, user3.id.toString())).toBe(true);
		expect(result.name).toBe("test_group");
	});
});

function containsId(recipients: APIChannelUser[], id: Snowflake | undefined) {
	return recipients.some((x) => x.id === id);
}
