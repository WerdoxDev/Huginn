import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIGetChannelMessagesResult, ChannelType, MessageType } from "@huginn/shared";
import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestMessages, createTestUsers } from "#tests/utils";

describe("GET /channels/:channelId/messages", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user] = await createTestUsers(2);

		const result = testHandler("/api/channels/invalid/messages", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000/messages", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Channel"); // Invalid id
	});

	test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// No token
		const result = testHandler(`/api/channels/${channel.id}/messages`, {}, "GET");
		expect(result).rejects.toThrow("Unauthorized");

		// User not part of the channel
		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user3.accessToken), "GET");
		expect(result2).rejects.toThrow("Missing Access");
	});

	test("should return a channel's messages when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const messages = await createTestMessages(channel.id, user.id, 60);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "GET")) as APIGetChannelMessagesResult;

		expect(result).toBeArray();
		// Maximum returned messages should be 50
		expect(result).toHaveLength(50);

		for (const [i, message] of result.entries()) {
			expectMessageExactSchema(message, MessageType.DEFAULT, messages[i + 10].id, channel.id, user, messages[i + 10].content);
		}
	});
	test("should return 'n' of channel's messages when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const messages = await createTestMessages(channel.id, user.id, 10);

		const result = (await testHandler(
			`/api/channels/${channel.id}/messages?limit=5`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetChannelMessagesResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(5);
		expect(result.every((x) => messages.slice(5).some((y) => x.id === y.id.toString()))).toBeTrue();
	});
	test("should return 'n' of channel's messages before or after a certain id when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const messages = await createTestMessages(channel.id, user.id, 10);

		// With before
		const result = (await testHandler(
			`/api/channels/${channel.id}/messages?before=${messages[5].id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetChannelMessagesResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(5);
		expect(result.every((x) => messages.slice(0, 5).some((y) => x.id === y.id.toString()))).toBeTrue();
		for (const [i, message] of result.entries()) {
			expectMessageExactSchema(message, MessageType.DEFAULT, messages[i].id, channel.id, user, messages[i].content);
		}

		// With after
		const result2 = (await testHandler(
			`/api/channels/${channel.id}/messages?after=${messages[4].id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetChannelMessagesResult;

		expect(result2).toBeArray();
		expect(result2).toHaveLength(5);
		expect(result2.every((x) => messages.slice(5).some((y) => x.id === y.id.toString()))).toBeTrue();
		for (const [i, message] of result2.entries()) {
			expectMessageExactSchema(message, MessageType.DEFAULT, messages[i + 5].id, channel.id, user, messages[i + 5].content);
		}
	});
});
