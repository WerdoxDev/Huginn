import { describe, expect, test } from "bun:test";
import { type APIDeleteDMChannelResult, type APIPostDMChannelResult, ChannelType } from "@huginn/shared";
import { prisma } from "#database";
import { authHeader, createTestChannel, createTestUsers, testHandler } from "#tests/utils";

describe("channel-remove-dm", () => {
	test("invalid", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/channels/invalid", authHeader(user.accessToken), "DELETE");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000", authHeader(user.accessToken), "DELETE");
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id
	});

	test("unauthorized", async () => {
		const [user, user2, user3, user4] = await createTestUsers(4);

		const channel = await createTestChannel(undefined, ChannelType.GROUP_DM, user.id, user2.id);
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
		"successful",
		async () => {
			const [user, user2, user3] = await createTestUsers(3);

			const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Recipient closes dm channel
			const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "DELETE")) as APIDeleteDMChannelResult;
			expect(result?.id).toBe(channel.id.toString());
			// The deleted channel should not include deleted user
			expect(result.recipients.some((x) => x.id === user.id.toString())).toBeFalse();

			// Non owner leaves group channel
			const result2 = (await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user2.accessToken), "DELETE")) as APIDeleteDMChannelResult;
			expect(result2?.id).toBe(groupChannel.id.toString());
			// The deleted channel should not include deleted user
			expect(result2.recipients.some((x) => x.id === user2.id.toString())).toBeFalse();

			// Owner leaves group channel
			const result3 = (await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user.accessToken), "DELETE")) as APIDeleteDMChannelResult;
			expect(result3?.id).toBe(groupChannel.id.toString());
			// The deleted channel should not include deleted user
			expect(result3.recipients.some((x) => x.id === user.id.toString())).toBeFalse();

			// Because owner left the channel, someone else now has to be the owner
			const exists = await prisma.channel.exists({ id: groupChannel.id, ownerId: { in: [user2.id, user3.id] } });
			expect(exists).toBeTrue();

			//TODO: CHECK USER CHANNELS TO MAKE SURE IT IS DELETED
		},
		{ timeout: 10000 },
	);

	test("restore successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// Leave the channel
		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user2.accessToken), "DELETE")) as APIDeleteDMChannelResult;
		expect(result?.id).toBe(channel.id.toString());

		// Reenter the channel
		const result2 = (await testHandler("/api/users/@me/channels", authHeader(user2.accessToken), "POST", {
			recipients: [user.id.toString()],
		})) as APIPostDMChannelResult;
		expect(result2?.id).toBe(channel.id.toString());

		// TODO: CHECK IF THE CHANNEL IS ACTUALLY ADDED TO DB
	});
});
