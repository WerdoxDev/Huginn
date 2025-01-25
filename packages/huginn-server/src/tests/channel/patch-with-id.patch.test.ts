import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIPatchDMChannelResult, ChannelType, getFileHash, resolveImage, toArrayBuffer } from "@huginn/shared";
import pathe from "pathe";
import { prisma } from "#database";
import { expectChannelExactRecipients, expectChannelExactSchema, expectReadStatesExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers, isCDNRunning } from "#tests/utils";

describe("PATCH /channels/:channelId", () => {
	test(
		"should return 'Invalid Form Body' when id is invalid or body constrains are not met",
		async () => {
			const [user, user2, user3, user4] = await createTestUsers(4);

			const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Name too long
			const result = testHandler(`/api/channels/${groupChannel.id}`, authHeader(user.accessToken), "PATCH", { name: ".".repeat(101) });
			expect(result).rejects.toThrow("Invalid Form Body");

			// Unknown User
			const result2 = testHandler(`/api/channels/${groupChannel.id}/recipients/123`, authHeader(user.accessToken), "DELETE");
			expect(result2).rejects.toThrow("Unknown User");

			// Unknown User
			const result3 = testHandler(`/api/channels/${groupChannel.id}/recipients/123`, authHeader(user.accessToken), "PUT");
			expect(result3).rejects.toThrow("Unknown User");

			// Recipient not part of the channel
			const result4 = testHandler(`/api/channels/${groupChannel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "DELETE");
			expect(result4).rejects.toThrow("Invalid Recipient");

			// Channel is not a group
			const result5 = testHandler(`/api/channels/${channel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "PUT");
			expect(result5).rejects.toThrow("Invalid Channel Type");

			// Channel is not a group
			const result6 = testHandler(`/api/channels/${channel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "DELETE");
			expect(result6).rejects.toThrow("Invalid Channel Type");
		},
		{ timeout: 10000 },
	);

	test(
		"should return 'Unauthorized' when no token is passed or user does not have the channel",
		async () => {
			const [user, user2, user3, user4] = await createTestUsers(4);

			const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			const result = testHandler(`/api/channels/${channel.id}`, {}, "PATCH", { name: "something_else" });
			expect(result).rejects.toThrow("Unauthorized");

			// User 4 does not have the channel and can't add a recipient to it.
			const result2 = testHandler(`/api/channels/${channel.id}/recipients/${user3.id}`, authHeader(user4.accessToken), "PUT");
			expect(result2).rejects.toThrow("Missing Access");

			// User 4 does not have the channel and can't remove a recipient from it.
			const result3 = testHandler(`/api/channels/${channel.id}/recipients/${user3.id}`, authHeader(user4.accessToken), "DELETE");
			expect(result3).rejects.toThrow("Missing Access");

			// User 3 is not the owner and can't remove a recipient from it.
			const result4 = testHandler(`/api/channels/${channel.id}/recipients/${user3.id}`, authHeader(user2.accessToken), "DELETE");
			expect(result4).rejects.toThrow("Missing Permission");
		},
		{ timeout: 10000 },
	);

	test(
		"should add and remove a recipient from a channel when the request is successful",
		async () => {
			const [user, user2, user3, user4, user5] = await createTestUsers(5);

			const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Owner adds user4
			const result = testHandler(`/api/channels/${channel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "PUT");
			expect(result).resolves.toBe(undefined);

			// user4 should have a read state
			const readStates = await prisma.readState.findMany({ where: { userId: BigInt(user4.id) } });
			expectReadStatesExactSchema(readStates, channel.id.toString(), [user4.id]);

			// Non owner adds user5
			const result2 = testHandler(`/api/channels/${channel.id}/recipients/${user5.id}`, authHeader(user2.accessToken), "PUT");
			expect(result2).resolves.toBe(undefined);

			// user5 should have a read state
			const readStates2 = await prisma.readState.findMany({ where: { userId: BigInt(user5.id) } });
			expectReadStatesExactSchema(readStates2, channel.id.toString(), [user5.id]);

			// Owner removes user4
			const result3 = testHandler(`/api/channels/${channel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "DELETE");
			expect(result3).resolves.toBe(undefined);

			// user4 should not have a read state
			const exists = await prisma.readState.exists({ userId: BigInt(user4.id) });
			expect(exists).toBeFalse();
		},
		{ timeout: 10000 },
	);

	test(
		"should return the edited channel when the request is successful",
		async () => {
			const [user, user2, user3] = await createTestUsers(3);

			const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Owner edits channel
			const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "PATCH", {
				name: "test_group_edited",
			})) as APIPatchDMChannelResult;

			expectChannelExactSchema(result, ChannelType.GROUP_DM, channel.id, [user.id], "test_group_edited");
			expectChannelExactRecipients(result, [user2, user3]);

			const channel2 = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Non owner edits channel
			const result2 = (await testHandler(`/api/channels/${channel2.id}`, authHeader(user2.accessToken), "PATCH", {
				name: "test_group_edited2",
			})) as APIPatchDMChannelResult;

			expectChannelExactSchema(result2, ChannelType.GROUP_DM, channel2.id, [user.id], "test_group_edited2");
			expectChannelExactRecipients(result2, [user, user3]);
		},
		{ timeout: 10000 },
	);

	test.skipIf(!isCDNRunning)("should change the channel icon when the request is successful", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		const iconData = await resolveImage(pathe.resolve(__dirname, "../pixel.png"));
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const iconHash = getFileHash(toArrayBuffer(iconData!));

		// Owner edits channel icon
		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "PATCH", {
			icon: iconData,
		})) as APIPatchDMChannelResult;

		expectChannelExactSchema(result, ChannelType.GROUP_DM, channel.id, [user.id], undefined, iconHash);
		expectChannelExactRecipients(result, [user2, user3]);

		const channel2 = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		// Non owner edits channel icon
		const result2 = (await testHandler(`/api/channels/${channel2.id}`, authHeader(user2.accessToken), "PATCH", {
			icon: iconData,
		})) as APIPatchDMChannelResult;

		expectChannelExactSchema(result2, ChannelType.GROUP_DM, channel2.id, [user.id], undefined, iconHash);
		expectChannelExactRecipients(result2, [user, user3]);
	});
});
