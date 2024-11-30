import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { type APIPostDefaultMessageResult, ChannelType } from "@huginn/shared";
import { authHeader, createTestChannel, createTestUser, removeChannels, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeChannels();
	await removeUsers();
});

describe("message-create", () => {
	test("invalid", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler("/api/channels/invalid/messages", authHeader(user.accessToken), "POST", { content: "test" });
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000/messages", authHeader(user.accessToken), "POST", { content: "test" });
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id

		const result3 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", { content: "" });
		expect(result3).rejects.toThrow("Invalid Form Body"); // Invalid content
	});

	test("unauthorized", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");
		const user3 = await createTestUser("test3", "test3", "test3@gmail.com", "test3");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler(`/api/channels/${channel.id}/messages`, {}, "POST", { content: "test" });
		expect(result).rejects.toThrow("Unauthorized");

		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user3.accessToken), "POST", { content: "test" });
		expect(result2).rejects.toThrow("Missing Access");
	});

	test("successful", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");
		const user2 = await createTestUser("test2", "test2", "test2@gmail.com", "test2");

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			content: "test",
		})) as APIPostDefaultMessageResult;

		expect(result.channelId).toBe(channel.id.toString());
		expect(result.content).toBe("test");
		expect(result.author.id).toBe(user.id.toString());
	});
});
