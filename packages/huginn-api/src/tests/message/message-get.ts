import type { Snowflake } from "@huginn/shared";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("message-get", () => {
	it("message-get-invalid", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll())[0];

		expect(() => client.channels.getMessage(channel.id, "invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.channels.getMessage(channel.id, "000000000000000000")).toThrow("Unknown Message"); // Unknown id
	});
	it("message-get-channel-messages-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group")!;

		const messages = await client.channels.getMessages(channel.id);

		expect(messages).toBeDefined();
		expect(messages).toBeArray();
		expect(messages).toHaveLength(50);
	});
	it("message-get-channel-messages-with-limit", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group")!;

		const limit = 20;
		const messages = await client.channels.getMessages(channel.id, limit);

		expect(messages).toBeDefined();
		expect(messages).toBeArray();
		expect(messages).toHaveLength(20);
	});
	it("message-get-channel-messages-with-before", async () => {
		const client = await getLoggedClient();
		const channel = (await client.channels.getAll())[1];

		const messages: Snowflake[] = [];

		for (let i = 0; i < 2; i++) {
			// test1 test2
			messages.push((await client.channels.createMessage(channel.id, { content: `test${i + 1}` })).id);
		}

		const id = (await client.channels.getMessages(channel.id, 1, messages[1]))[0].id;

		const idToCheck = messages[0];
		expect(idToCheck).toBe(id);
	});
});
