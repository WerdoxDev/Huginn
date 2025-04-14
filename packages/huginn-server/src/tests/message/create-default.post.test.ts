import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIPostDefaultMessageJSONBody, type APIPostDefaultMessageResult, ChannelType, MessageType } from "@huginn/shared";
import { resolve } from "pathe";
import { expectAttachmentExactSchema, expectEmbedExactSchema, expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers, getReadyWebSocket, isCDNRunning, testIsDispatch } from "#tests/utils";

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

		const result4 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {});
		expect(result4).rejects.toThrow("Invalid Form Body"); // Nothing
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

	test("should return 'Invalid Form Body' when embed constrains are not met", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// rich type url requires title
		const result = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ url: "https://huginn.dev", type: "rich" }],
		});
		expect(result).rejects.toThrow("Invalid Form Body");

		// rich type timestamp requires either title or description or thumbnail
		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ timestamp: new Date().toISOString(), type: "rich" }],
		});
		expect(result2).rejects.toThrow("Invalid Form Body");

		// image type requires url and thumnail url
		const result3 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ type: "image", url: "https://huginn.dev/huginn-meta.png" }],
		});
		expect(result3).rejects.toThrow("Invalid Form Body");
		const result4 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ type: "image", thumbnail: { url: "https://huginn.dev/huginn-meta.png" } }],
		});
		expect(result4).rejects.toThrow("Invalid Form Body");

		// video type requires url and video url
		const result5 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ type: "video", url: "https://huginn.dev/huginn-meta.png" }],
		});
		expect(result5).rejects.toThrow("Invalid Form Body");
		const result6 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ type: "video", video: { url: "https://huginn.dev/huginn-meta.png" } }],
		});
		expect(result6).rejects.toThrow("Invalid Form Body");
	});

	test.if(isCDNRunning)("should return 'Invalid Form Body' when attachment constrains are not met", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		// payload_json is not passed
		const body1 = new FormData();
		body1.append("files[0]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]), "pixel.png");

		const result1 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", body1);
		expect(result1).rejects.toThrow("Invalid Form Body");

		// attachment files are not added
		const body2 = new FormData();
		body2.append("payload_json", JSON.stringify({ attachments: [{ id: 0, description: "test", filename: "pixel.png" }] }));

		const result2 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", body2);
		expect(result2).rejects.toThrow("Invalid Form Body");

		// payload_json includes a filename that doesn't exist in attached files
		const body3 = new FormData();
		body3.append("files[0]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]), "pixel.png");
		body3.append("payload_json", JSON.stringify({ attachments: [{ id: 0, description: "test", filename: "invalid.png" }] }));

		const result3 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", body3);
		expect(result3).rejects.toThrow("Invalid Form Body");

		// attachment with no filename
		const body4 = new FormData();
		body4.append("files[0]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]));
		body4.append("payload_json", JSON.stringify({ attachments: [{ id: 0, description: "test", filename: "pixel.png" }] }));

		const result4 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", body4);
		expect(result4).rejects.toThrow("Invalid Form Body");

		// attachment non-existing index
		const body5 = new FormData();
		body5.append("files[0]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]), "pixel.png");
		body5.append("payload_json", JSON.stringify({ attachments: [{ id: 1, description: "test", filename: "pixel.png" }] }));

		const result5 = testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", body5);
		expect(result5).rejects.toThrow("Invalid Form Body");
	});

	test.if(isCDNRunning)("should create a message with a single attachment when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const body = new FormData();
		body.append("files[0]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]), "pixel.png");
		body.append("payload_json", JSON.stringify({ attachments: [{ id: 0, filename: "pixel.png", description: "test" }] }));

		const result = (await testHandler(
			`/api/channels/${channel.id}/messages`,
			authHeader(user.accessToken),
			"POST",
			body,
		)) as APIPostDefaultMessageResult;

		expect(result.attachments).toBeArray();
		expect(result.attachments).toHaveLength(1);
		expectAttachmentExactSchema(result.attachments[0], result.id, result.channelId, "pixel.png", 1, 1, "test");
	});

	test.if(isCDNRunning)("should create a message with multiple attachments when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const body = new FormData();
		body.append("files[0]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]), "pixel.png");
		body.append("files[1]", new Blob([await Bun.file(resolve(__dirname, "../pixel.png")).arrayBuffer()]), "pixel2.png");
		body.append(
			"payload_json",
			JSON.stringify({
				attachments: [
					{ id: 0, filename: "pixel.png", description: "test" },
					{ id: 1, filename: "pixel2.png", description: "test2" },
				],
			}),
		);

		const result = (await testHandler(
			`/api/channels/${channel.id}/messages`,
			authHeader(user.accessToken),
			"POST",
			body,
		)) as APIPostDefaultMessageResult;

		expect(result.attachments).toBeArray();
		expect(result.attachments).toHaveLength(2);
		expectAttachmentExactSchema(result.attachments[0], result.id, result.channelId, "pixel.png", 1, 1, "test");
		expectAttachmentExactSchema(result.attachments[1], result.id, result.channelId, "pixel2.png", 1, 1, "test2");
	});

	test("should create an embed from message content when the request is successful", async (done) => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			content: "https://huginn.dev",
		})) as APIPostDefaultMessageResult;

		expectMessageExactSchema(result, MessageType.DEFAULT, undefined, channel.id, user, "https://huginn.dev", undefined);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "message_update")) {
				expect(data.d.id).toBe(result.id);
				expect(data.d.embeds).toBeArray();
				expect(data.d.embeds).toHaveLength(1);
				expectEmbedExactSchema(
					data.d.embeds[0],
					"rich",
					"Huginn - Norse Chat App",
					"https://huginn.dev/",
					"A fast, customizable chat app with a touch of Norse mythology.",
					undefined,
					{ url: "https://huginn.dev/huginn-meta.png", width: 1150, height: 609 },
				);
				done();
			}
		};
	});

	test("should return a message with manually added embeds when the request is successful", async () => {
		const [user, user2] = await createTestUsers(2);
		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
			embeds: [{ url: "https://huginn.dev/huginn-meta.png", type: "image", thumbnail: { url: "https://huginn.dev/huginn-meta.png" } }],
		} as APIPostDefaultMessageJSONBody)) as APIPostDefaultMessageResult;

		expect(result.embeds).toBeArray();
		expect(result.embeds).toHaveLength(1);
		expectEmbedExactSchema(result.embeds[0], "image", undefined, "https://huginn.dev/huginn-meta.png", undefined, undefined, {
			url: "https://huginn.dev/huginn-meta.png",
			width: 1150,
			height: 609,
		});
	});
});
