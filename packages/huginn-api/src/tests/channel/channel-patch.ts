import { describe, expect, test } from "bun:test";
import path from "node:path";
import { getLoggedClient, test2Credentials, test3Credentials } from "../test-utils";

describe("channel-patch", () => {
	test("channel-patch-invalid", async () => {
		const client = await getLoggedClient();
		const secondClient = await getLoggedClient(test2Credentials);

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group");
		expect(channel).toBeDefined();
		expect(secondClient.user).toBeDefined();
		if (!channel || !secondClient.user) return;

		expect(() =>
			client.channels.editDM(channel.id, {
				name: ".....................................................................................................",
			}),
		).toThrow("Invalid Form Body");
		expect(() => client.channels.editDM(channel.id, { recipients: [] })).toThrow("Invalid Form Body");
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		expect(() => client.channels.editDM(channel.id, { recipients: [secondClient.user!.id] })).toThrow("Invalid Form Body");
	});
	test("channel-patch-successful", async () => {
		const client = await getLoggedClient();
		const secondClient = await getLoggedClient(test2Credentials);
		const thirdClient = await getLoggedClient(test3Credentials);

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group");
		expect(channel).toBeDefined();
		expect(secondClient.user).toBeDefined();
		expect(thirdClient.user).toBeDefined();
		if (!channel || !secondClient.user || !thirdClient.user || !client.user) return;

		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const result = await client.channels.editDM(channel.id, { name: "test_group_edited", recipients: [thirdClient.user!.id] });
		expect(result).toBeDefined();
		expect(result.name).toBe("test_group_edited");
		expect(result.recipients.map((x) => x.id)).toContain(thirdClient.user.id);
		expect(result.recipients.map((x) => x.id)).not.toContain(secondClient.user.id);
	});
	test("channel-patch-revert-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group");
		expect(channel).toBeDefined();
		if (!channel) return;

		const result = await client.channels.editDM(channel.id, { name: "test_group" });
		expect(result).toBeDefined();
		expect(result.name).toBe("test_group");
	});
	test("channel-patch-icon-successful", async () => {
		const client = await getLoggedClient();

		const channel = (await client.channels.getAll()).find((x) => x.name === "test_group");
		expect(channel).toBeDefined();
		if (!channel) return;

		const result = await client.channels.editDM(channel.id, { icon: path.resolve(__dirname, "../pixel.png") });

		expect(result.icon).toBeDefined();
		expect(result.icon).toHaveLength(32);
	});
});
