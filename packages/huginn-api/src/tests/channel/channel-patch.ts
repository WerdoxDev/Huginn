import path from "node:path";
import { ChannelType } from "@huginn/shared";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient, test2Credentials, test3Credentials, test4Credentials } from "../test-utils.ts";

describe("channel-patch", () => {
	it("channel-patch-invalid", async () => {
		const client = await getLoggedClient();
		const client4 = await getLoggedClient(test4Credentials);

		const groupChannel = (await client.channels.getAll()).find((x) => x.name === "test_group")!;
		const channel = (await client.channels.getAll()).find((x) => x.type === ChannelType.DM)!;

		expect(() => client.channels.editDM(groupChannel!.id, { name: ".".repeat(101) })).toThrow("Invalid Form Body");
		expect(() => client.channels.addRecipient(groupChannel.id, "123")).toThrow("Unknown User");
		expect(() => client.channels.removeRecipient(groupChannel.id, "123")).toThrow("Unknown User");
		expect(() => client.channels.removeRecipient(groupChannel.id, client4.user!.id)).toThrow("Invalid Recipient");
		expect(() => client.channels.addRecipient(channel.id, client4.user!.id)).toThrow("Invalid Channel Type");
		expect(() => client.channels.removeRecipient(channel.id, client4.user!.id)).toThrow("Invalid Channel Type");
	});

	it("channel-patch-unauthorized", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);
		const client3 = await getLoggedClient(test3Credentials);
		const client4 = await getLoggedClient(test4Credentials);

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group")!;

		expect(() => client4.channels.addRecipient(channel.id, client3.user!.id)).toThrow("Missing Access"); // Does not have that channel
		expect(() => client4.channels.removeRecipient(channel.id, client3.user!.id)).toThrow("Missing Access"); // Does not have that channel
		expect(() => client2.channels.removeRecipient(channel.id, client3.user!.id)).toThrow("Missing Permission"); // Is not the owner
	});

	it("channel-patch-not-owner-successful", async () => {
		const client2 = await getLoggedClient(test2Credentials);
		const client4 = await getLoggedClient(test4Credentials);

		const channel = (await client2.channels.getAll()).find((x) => x.name === "test_group")!;

		expect(() => client2.channels.addRecipient(channel.id, client4.user!.id)).not.toThrow();
	});

	it("channel-patch-successful", async () => {
		const client = await getLoggedClient();
		const client4 = await getLoggedClient(test4Credentials);

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group")!;

		const result = await client.channels.editDM(channel!.id, { name: "test_group_edited" });

		expect(() => client.channels.addRecipient(channel.id, client4.user!.id)).not.toThrow();
		expect(result.name).toBe("test_group_edited");
	});

	it("channel-patch-revert-successful", async () => {
		const client = await getLoggedClient();
		const client4 = await getLoggedClient(test4Credentials);

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group_edited")!;

		const result = await client.channels.editDM(channel.id, { name: "test_group" });

		expect(() => client.channels.removeRecipient(channel.id, client4.user!.id)).not.toThrow();
		expect(result.name).toBe("test_group");
	});

	it("channel-patch-icon-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group")!;

		const result = await client.channels.editDM(channel.id, { icon: path.resolve(__dirname, "../pixel.png") });

		expect(result.icon).toBeDefined();
		expect(result.icon).toHaveLength(32);
	});
});
