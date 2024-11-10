import { describe, expect, test } from "bun:test";
import { ChannelType } from "@huginn/shared";
import { getLoggedClient, test2Credentials, test3Credentials } from "../test-utils";

describe("channel-remove-dm", () => {
	test("channel-remove-dm-invalid", async () => {
		const client = await getLoggedClient();
		const client3 = await getLoggedClient(test3Credentials);

		const channels = (await client.channels.getAll()).filter((x) => x.type === ChannelType.DM);
		const channel = channels.find((x) => x.recipients.some((y) => y.id !== client3.user!.id))!;

		expect(() => client.channels.deleteDM("invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.channels.deleteDM("000000000000000000")).toThrow("Unknown Channel"); // Unknown id
		expect(() => client3.channels.get(channel.id)).toThrow("Missing Access"); // Not part of channel
	});
	test("channel-remove-dm-successful", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);

		const channels = await client.channels.getAll();
		const channel = channels.find((x) => x.type === ChannelType.DM && x.recipients.some((x) => x.id === client2.user?.id))!;

		const result = await client.channels.deleteDM(channel.id);

		expect(result).toBeDefined();
		expect(result.id).toBe(channel.id);

		const newChannels = await client.channels.getAll();

		expect(newChannels.some((x) => x.id === channel.id)).toBeFalse();
	});
	test("channel-remove-dm-restore-successful", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);

		const channels = await client.channels.getAll();

		await client.channels.createDM({ recipients: [client2.user!.id] });

		const newChannels = await client.channels.getAll();

		expect(newChannels).toHaveLength(channels.length + 1);
		expect(newChannels.some((x) => x.type === ChannelType.DM && x.recipients.some((x) => x.id === client2.user?.id))).toBeTrue();
	});
});
