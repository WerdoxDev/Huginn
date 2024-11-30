import { afterEach, describe, expect, test } from "bun:test";
import { type APIGetChannelMessagesResult, ChannelType, type Snowflake } from "@huginn/shared";
import { prisma } from "#database";
import {
	authHeader,
	createManyTestMessages,
	createTestChannel,
	createTestMessage,
	createTestUser,
	removeChannels,
	removeUsers,
	testHandler,
} from "#tests/utils";

afterEach(async () => {
	await removeChannels();
	await removeUsers();
});

describe("message-get", () => {
	test("invalid", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler(`/api/channels/${channel.id}/messages/invalid`, authHeader(user.accessToken), "GET");
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler(`/api/channels/${channel.id}/messages/000000000000000000`, authHeader(user.accessToken), "GET");
		expect(result2).rejects.toThrow("Unknown Message"); // Invalid id
	});

	test("unauthorized", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");
		const user3 = await createTestUser("test3", "test3", "test3@gmail.com", "test3");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
		const message = await createTestMessage(channel.id, user.id, "test");

		const result = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, {}, "GET");
		expect(result).rejects.toThrow("Unauthorized");

		const result2 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user3.accessToken), "GET");
		expect(result2).rejects.toThrow("Missing Access");
	});

	test("successful", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const messages = await createManyTestMessages(channel.id, user.id, 10);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "GET")) as APIGetChannelMessagesResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(10);
		expect(result.every((x) => messages.some((y) => x.id === y.id.toString()))).toBeTrue();
	});
	test("with limit", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const messages = await createManyTestMessages(channel.id, user.id, 10);

		const result = (await testHandler(
			`/api/channels/${channel.id}/messages?limit=5`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetChannelMessagesResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(5);
		expect(result.every((x) => messages.slice(5).some((y) => x.id === y.id.toString()))).toBeTrue();
	});
	test("with before & after", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const messages = await createManyTestMessages(channel.id, user.id, 10);

		// With before
		const result = (await testHandler(
			`/api/channels/${channel.id}/messages?before=${messages[5].id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetChannelMessagesResult;

		expect(result).toBeArray();
		expect(result).toHaveLength(5);
		expect(result.every((x) => messages.slice(0, 5).some((y) => x.id === y.id.toString()))).toBeTrue();

		// With after
		const result2 = (await testHandler(
			`/api/channels/${channel.id}/messages?after=${messages[4].id}`,
			authHeader(user.accessToken),
			"GET",
		)) as APIGetChannelMessagesResult;

		expect(result2).toBeArray();
		expect(result2).toHaveLength(5);
		expect(result2.every((x) => messages.slice(5).some((y) => x.id === y.id.toString()))).toBeTrue();
	});
});
