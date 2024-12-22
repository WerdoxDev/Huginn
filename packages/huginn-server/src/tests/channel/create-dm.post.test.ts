import { describe, expect, test } from "bun:test";
import { type APIPostDMChannelResult, ChannelType } from "@huginn/shared";
import { prisma } from "#database";
import { expectChannelExactRecipients, expectChannelExactSchema, expectReadStatesExactSchema } from "#tests/expect-utils";
import { authHeader, createTestUsers, removeChannelLater, testHandler } from "#tests/utils";

describe("POST /users/@me/channels", () => {
	test("should return 'Invalid Form Body' when body constrains are not met", async () => {
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
	test("should return 'Unauthorized' when no token is passed", async () => {
		const [_user, user2] = await createTestUsers(2);

		const result = testHandler("/api/users/@me/channels", {}, "POST", { recipients: [user2.id.toString()] }).then(removeChannelLater);
		expect(result).rejects.toThrow("Unauthorized");
	});
	test("should create a channel with type 0 (DM) with read states when request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
			recipients: [user2.id.toString()],
		}).then(removeChannelLater)) as APIPostDMChannelResult;

		expectChannelExactSchema(result, ChannelType.DM);
		expectChannelExactRecipients(result, [user2]);

		// Expect all read states to be created
		const readStates = await prisma.readState.findMany({ where: { channelId: BigInt(result.id) } });
		expectReadStatesExactSchema(readStates, result.id, [user.id, user2.id]);
	});
	test("should create a channel with type 1 (GROUP_DM) with read states when request is successful", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
			recipients: [user2.id.toString(), user3.id.toString()],
		}).then(removeChannelLater)) as APIPostDMChannelResult;

		expectChannelExactSchema(result, ChannelType.GROUP_DM, undefined, [user.id]);
		expectChannelExactRecipients(result, [user2, user3]);

		// Expect all read states to be created
		const readStates = await prisma.readState.findMany({ where: { channelId: BigInt(result.id) } });
		expectReadStatesExactSchema(readStates, result.id, [user.id, user2.id, user3.id]);
	});
	test("should create a channel with type 1 (GROUP_DM) and name 'test_group' when request is successful", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
			recipients: [user2.id.toString(), user3.id.toString()],
			name: "test_group",
		}).then(removeChannelLater)) as APIPostDMChannelResult;

		expectChannelExactSchema(result, ChannelType.GROUP_DM, undefined, [user.id], "test_group");
		expectChannelExactRecipients(result, [user2, user3]);

		// Expect all read states to be created
		const readStates = await prisma.readState.findMany({ where: { channelId: BigInt(result.id) } });
		expectReadStatesExactSchema(readStates, result.id, [user.id, user2.id, user3.id]);
	});
});
