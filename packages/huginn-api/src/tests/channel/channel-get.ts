import { describe, expect, test } from "bun:test";
import { ChannelType } from "@huginn/shared";
import { getLoggedClient, test3Credentials } from "../test-utils";

describe("channel-get", () => {
	test("channel-get-by-id-invalid", async () => {
		const client = await getLoggedClient();
		const client3 = await getLoggedClient(test3Credentials);

		const channels = (await client.channels.getAll()).filter((x) => x.type === ChannelType.DM);
		const channel = channels.find((x) => x.recipients.some((y) => y.id !== client3.user!.id))!;

		expect(() => client.channels.get("invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.channels.get("000000000000000000")).toThrow("Unknown Channel"); // Unknown id
		expect(() => client3.channels.get(channel.id)).toThrow("Missing Access"); // Not part of channel
	});
	test("channel-get-all-successful", async () => {
		const client = await getLoggedClient();

		const channels = await client.channels.getAll();

		expect(channels).toBeDefined();
		expect(channels.length).toBeGreaterThan(0);
	});
	test("channel-get-by-id-successful", async () => {
		const client = await getLoggedClient();

		const channels = await client.channels.getAll();

		const channel = await client.channels.get(channels[0].id);
		expect(channel).toBeDefined();
	});
});
