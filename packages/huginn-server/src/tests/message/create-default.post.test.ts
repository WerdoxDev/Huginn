import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIPostDefaultMessageResult, ChannelType, MessageType } from "@huginn/shared";
import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers } from "#tests/utils";

describe("POST /api/channels/:channelId/messages", () => {
	test("should return 'Invalid Form Body' when id is invalid or body constrains are not met", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler("/api/channels/invalid/messages", authHeader(user.accessToken), "POST", { content: "test" });
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000/messages", authHeader(user.accessToken), "POST", { content: "test" });
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id

		const result3 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", { content: "" });
		expect(result3).rejects.toThrow("Invalid Form Body"); // Invalid content
	});

	test("should return 'Invalid Form Body' when embed constrains are not met", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// Url requires title
		const result = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ url: "" }],
		});
		expect(result).rejects.toThrow("Invalid Form Body");

		// Timestamp requires either title or description or thumbnail
		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ timestamp: new Date().toISOString() }],
		});
		expect(result2).rejects.toThrow("Invalid Form Body");
	});

	test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// No token
		const result = testHandler(`/api/channels/${channel.id}/messages`, {}, "POST", { content: "test" });
		expect(result).rejects.toThrow("Unauthorized");

		// User does not have the channel
		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user3.accessToken), "POST", { content: "test" });
		expect(result2).rejects.toThrow("Missing Access");
	});

	test("should create a message in the channel when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			content: "test",
		})) as APIPostDefaultMessageResult;

		expectMessageExactSchema(result, MessageType.DEFAULT, undefined, channel.id, user, "test");
	});
});
