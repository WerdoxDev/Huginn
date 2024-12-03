import { describe, expect, test } from "bun:test";
import path from "node:path";
import { type APIPatchDMChannelResult, ChannelType, resolveImage } from "@huginn/shared";
import { authHeader, createTestChannel, createTestUsers, isCDNRunning, testHandler } from "#tests/utils";

describe("channel-patch", () => {
	test(
		"invalid",
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

	test("unauthorized", async () => {
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
	});

	test(
		"add & remove recipients",
		async () => {
			const [user, user2, user3, user4, user5] = await createTestUsers(5);

			const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			// Owner adds user4
			const result = testHandler(`/api/channels/${channel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "PUT");
			expect(result).resolves.toBe(undefined);

			// Non owner adds user5
			const result2 = testHandler(`/api/channels/${channel.id}/recipients/${user5.id}`, authHeader(user2.accessToken), "PUT");
			expect(result2).resolves.toBe(undefined);

			// Owner removes user4
			const result3 = testHandler(`/api/channels/${channel.id}/recipients/${user4.id}`, authHeader(user.accessToken), "DELETE");
			expect(result3).resolves.toBe(undefined);
		},
		{ timeout: 10000 },
	);

	test("successful", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		// Owner edits channel
		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "PATCH", {
			name: "test_group_edited",
		})) as APIPatchDMChannelResult;

		expect(result.id).toBe(channel.id.toString());
		expect(result.name).toBe("test_group_edited");

		const channel2 = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		// Non owner edits channel
		const result2 = (await testHandler(`/api/channels/${channel2.id}`, authHeader(user2.accessToken), "PATCH", {
			name: "test_group_edited2",
		})) as APIPatchDMChannelResult;

		expect(result2.id).toBe(channel2.id.toString());
		expect(result2.name).toBe("test_group_edited2");
	});

	test.skipIf(!isCDNRunning)("icon successful", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		// Owner edits channel icon
		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "PATCH", {
			icon: await resolveImage(path.resolve(__dirname, "../pixel.png")),
		})) as APIPatchDMChannelResult;

		expect(result.id).toBe(channel.id.toString());
		expect(result.icon).toHaveLength(32);

		const channel2 = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

		// Non owner edits channel icon
		const result2 = (await testHandler(`/api/channels/${channel2.id}`, authHeader(user2.accessToken), "PATCH", {
			icon: await resolveImage(path.resolve(__dirname, "../pixel.png")),
		})) as APIPatchDMChannelResult;

		expect(result2.id).toBe(channel2.id.toString());
		expect(result2.icon).toHaveLength(32);
	});
});
