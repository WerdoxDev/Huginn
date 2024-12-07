import { describe, expect, test } from "bun:test";
import { type APIGetMessageByIdResult, ChannelType, MessageType } from "@huginn/shared";
import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestMessages, createTestUsers, testHandler } from "#tests/utils";

describe("GET /channels/:channelId/messages/:messageId", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler(`/api/channels/${channel.id}/messages/invalid`, authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler(`/api/channels/${channel.id}/messages/000000000000000000`, authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Message"); // Invalid id
	});

	test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const [message] = await createTestMessages(channel.id, user.id, 1);

		const result = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, {}, "GET");
		expect(result).rejects.toThrow("Unauthorized");

		const result2 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user3.accessToken), "GET");
		expect(result2).rejects.toThrow("Missing Access");
	});

	test("should return a channel's message with its id when the request is successful", async () => {
		const [user, user2] = await createTestUsers(3);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const [message] = await createTestMessages(channel.id, user.id, 1);

		const result = (await testHandler(
			`/api/channels/${channel.id}/messages/${message.id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetMessageByIdResult;

		expectMessageExactSchema(result, MessageType.DEFAULT, message.id, channel.id, user, message.content);
	});
});
