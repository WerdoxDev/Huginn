import { expect } from "@std/expect";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { url, getLoggedClient } from "../test-utils.ts";

beforeAll(async () => {
	await fetch(`http://${url}/api/test/test-messages`, { method: "POST" });
});

describe("message-create", () => {
	it("essage-create-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.channels.createMessage("invalid", { content: "test" })).toThrow("Invalid Form Body"); // Invalid id
		expect(() => client.channels.createMessage("000000000000000000", { content: "test" })).toThrow("Unknown Channel"); // Unknown id

		const channel = (await client.channels.getAll())[0];

		expect(() => client.channels.createMessage(channel.id, { content: "" })).toThrow(); // Invalid content
	});
	it("message-create-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll())[0];
		const result = await client.channels.createMessage(channel.id, { content: "test" });

		expect(result).toBeDefined();
	});
	it("message-create-55-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll())[0];

		async function createMessages() {
			for (let i = 0; i < 55; i++) {
				await client.channels.createMessage(channel.id, { content: `test${i + 1}` });
			}

			return true;
		}

		expect(createMessages).not.toThrow();
	});
	it("message-create-10-another-channel-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll())[1];

		async function createMessages() {
			for (let i = 0; i < 10; i++) {
				await client.channels.createMessage(channel.id, { content: `test${i + 1}` });
			}

			return true;
		}

		expect(createMessages).not.toThrow();
	});
});
