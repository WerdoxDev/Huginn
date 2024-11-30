import { afterEach, describe, expect, test } from "bun:test";
import { type APIGetChannelByIdResult, type APIGetUserChannelsResult, ChannelType } from "@huginn/shared";
import { authHeader, createTestChannel, createTestUser, removeChannels, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeChannels();
	await removeUsers();
});

describe("channel-get", () => {
	test("invalid", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");

		const result = testHandler("/api/channels/invalid", authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000", authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id
	});
	test("unauthorized", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");
		const user3 = await createTestUser("test3", "test3", "test3@gmail.com", "test3");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler(`/api/channels/${channel.id}`, authHeader(user3.accessToken), "GET");
		expect(result).rejects.toThrow("Missing Access"); // Not part of channel

		const result2 = testHandler(`/api/channels/${channel.id}`, {}, "GET");
		expect(result2).rejects.toThrow("Unauthorized");
	});
	test("get all", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");
		const user3 = await createTestUser("test3", "test3", "test3@gmail.com", "test3");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const channel2 = await createTestChannel(undefined, ChannelType.DM, user.id, user3.id);

		const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "GET")) as APIGetUserChannelsResult;

		expect(result).toBeArray();
		expect(result[0].id).toBe(channel.id.toString());
		expect(result[0].recipients[0].id).toBe(user2.id.toString());
		// Getting channels should not include the user who sent the request
		expect(result[0].recipients.some((x) => x.id === user.id.toString())).toBeFalse();

		expect(result[1].id).toBe(channel2.id.toString());
		expect(result[1].recipients[0].id).toBe(user3.id.toString());
		// Getting channels should not include the user who sent the request
		expect(result[1].recipients.some((x) => x.id === user.id.toString())).toBeFalse();
	});
	test("get by id", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = (await testHandler(`/api/channels/${channel.id}`, authHeader(user.accessToken), "GET")) as APIGetChannelByIdResult;

		expect(result?.id).toBe(channel.id.toString());
		// Getting a channel should not include the user who sent the request
		expect(result.recipients?.some((x) => x.id === user.id.toString())).toBeFalse();
	});
});
