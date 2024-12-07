import { describe, expect, test } from "bun:test";
import { type APIDeleteDMChannelResult, type APIPostDMChannelResult, ChannelType } from "@huginn/shared";
import { prisma } from "#database";
import { expectChannelExactRecipients, expectChannelExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers, testHandler } from "#tests/utils";

describe("DELETE /channels/:channelId", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/channels/invalid", authHeader(user.accessToken), "DELETE");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000", authHeader(user.accessToken), "DELETE");
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id
	});

	test("should return 'Unauthorized' when no token is passed or the user is not part of the channel", async () => {
		const [user, user2, user3, user4] = await createTestUsers(4);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		const result = testHandler(`/api/channels/${channel.id}`, {}, "DELETE");
		expect(result).rejects.toThrow("Unauthorized");

		// user4 doesn't have the channel
		const result2 = testHandler(`/api/channels/${channel.id}`, authHeader(user4.accessToken), "DELETE");
		expect(result2).rejects.toThrow("Missing Access");

		// user4 isn't part of the group channel
		const result3 = testHandler(`/api/channels/${groupChannel.id}`, authHeader(user4.accessToken), "DELETE");
		expect(result3).rejects.toThrow("Missing Access");
	});

	test(
		"should temporary close a type 0 (single) channel or leave a type 1 (group) channel when the request is successful",
		async () => {
			const [user, user2, user3] = await createTestUsers(3);

			const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Recipient closes dm channel
			const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "DELETE")) as APIDeleteDMChannelResult;
			expectChannelExactSchema(result, ChannelType.DM, channel.id);
			// The deleted channel should not include deleted user
			expectChannelExactRecipients(result, [user2]);

			// Non owner leaves group channel
			const result2 = (await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user2.accessToken), "DELETE")) as APIDeleteDMChannelResult;
			expectChannelExactSchema(result2, ChannelType.GROUP_DM, groupChannel.id, [user.id]);
			// The deleted channel should not include deleted user
			expectChannelExactRecipients(result2, [user, user3]);

			// Owner leaves group channel
			const result3 = (await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user.accessToken), "DELETE")) as APIDeleteDMChannelResult;
			expectChannelExactSchema(result3, ChannelType.GROUP_DM, groupChannel.id, [user3.id]);
			// The deleted channel should not include deleted user
			expectChannelExactRecipients(result3, [user3]);

			// Because owner left the channel, someone else now has to be the owner
			const exists = await prisma.channel.exists({ id: groupChannel.id, ownerId: { in: [user3.id] } });
			expect(exists).toBeTrue();

			//TODO: CHECK USER CHANNELS TO MAKE SURE IT IS DELETED
		},
		{ timeout: 10000 },
	);

	test("should restore a type 0 (single) channel from being closed when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// Leave the channel
		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user2.accessToken), "DELETE")) as APIDeleteDMChannelResult;
		expectChannelExactSchema(result, ChannelType.DM, channel.id);
		expectChannelExactRecipients(result, [user]);

		// Reenter the channel
		const result2 = (await testHandler("/api/users/@me/channels", authHeader(user2.accessToken), "POST", {
			recipients: [user.id.toString()],
		})) as APIPostDMChannelResult;
		expectChannelExactSchema(result2, ChannelType.DM, channel.id);
		expectChannelExactRecipients(result, [user]);

		// TODO: CHECK IF THE CHANNEL IS ACTUALLY ADDED TO DB
	});
});
