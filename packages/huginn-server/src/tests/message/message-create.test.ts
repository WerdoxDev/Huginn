import { describe, expect, test } from "bun:test";
import { type APIPostDefaultMessageResult, ChannelType } from "@huginn/shared";
import { authHeader, createTestChannel, createTestUsers, testHandler } from "#tests/utils";

describe("message-create", () => {
	test("invalid", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler("/api/channels/invalid/messages", authHeader(user.accessToken), "POST", { content: "test" });
		expect(result).rejects.toThrow("Snowflake"); // Invalid id

		const result2 = testHandler("/api/channels/000000000000000000/messages", authHeader(user.accessToken), "POST", { content: "test" });
		expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id

		const result3 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", { content: "" });
		expect(result3).rejects.toThrow("Invalid Form Body"); // Invalid content
	});

	test("unauthorized", async () => {
		const [user, user2, user3] = await createTestUsers(3);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = testHandler(`/api/channels/${channel.id}/messages`, {}, "POST", { content: "test" });
		expect(result).rejects.toThrow("Unauthorized");

		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user3.accessToken), "POST", { content: "test" });
		expect(result2).rejects.toThrow("Missing Access");
	});

	test("successful", async () => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			content: "test",
		})) as APIPostDefaultMessageResult;

		expect(result.channelId).toBe(channel.id.toString());
		expect(result.content).toBe("test");
		expect(result.author.id).toBe(user.id.toString());
	});
});
