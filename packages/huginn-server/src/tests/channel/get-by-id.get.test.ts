import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIGetChannelByIdResult, ChannelType, type DirectChannel } from "@huginn/shared";
import { expectChannelExactRecipients, expectChannelExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers } from "#tests/utils";

describe("GET /channels/:channelId", () => {
	test("should return 'Invalid Form Body' when id is invalid", async () => {
		const [user] = await createTestUsers(1);

		const result = testHandler("/api/channels/invalid", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id
	});
	test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler(`/api/channels/${channel.id}`, authHeader(user3.accessToken), "GET");
		expect(result).rejects.toThrow("Missing Access"); // Not part of channel

		const result2 = testHandler(`/api/channels/${channel.id}`, {}, "GET");
		expect(result2).rejects.toThrow("Unauthorized");
	});
	test("should return a channel by its id when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "GET")) as APIGetChannelByIdResult;

		expectChannelExactSchema(result, ChannelType.DM, channel.id, [user.id]);
		// TODO: This is only for DirectChannels.
		// Getting a channel should not include the user who sent the request
		expectChannelExactRecipients(result as DirectChannel, [user2]);
	});
});
