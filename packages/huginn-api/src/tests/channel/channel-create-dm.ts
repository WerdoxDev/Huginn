import type { Snowflake } from "@huginn/shared";
import type { APIChannelUser, APIGroupDMChannel, APIPostDMChannelJSONBody } from "@huginn/shared";
import { expect } from "@std/expect";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { url, getLoggedClient, test2Credentials, test3Credentials } from "../test-utils.ts";

beforeAll(async () => {
	await fetch(`http://${url}/api/test/test-channels`, { method: "POST" });
});

describe("channel-create-dm", () => {
	it("hannel-create-dm-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.channels.createDM({} as APIPostDMChannelJSONBody)).toThrow("Invalid Form Body"); // Invalid
		expect(() => client.channels.createDM({ recipients: [] } as APIPostDMChannelJSONBody)).toThrow("Invalid Form Body"); // Invalid id
		expect(() => client.channels.createDM({ recipients: ["000000000000000000"] })).toThrow("Unknown User"); // Unknown id
	});
	it("channel-create-single-dm-successful", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);

		const result = await client.channels.createDM({ recipients: [client2.user!.id] });

		expect(containsId(result.recipients, client2.user!.id)).toBe(true);
	});
	it("channel-create-group-dm-successful", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);
		const client3 = await getLoggedClient(test3Credentials);

		const result = (await client.channels.createDM({
			recipients: [client2.user!.id, client3.user!.id],
		})) as APIGroupDMChannel;

		expect(result.ownerId).toBe(client.user!.id);
		expect(containsId(result.recipients, client2.user!.id)).toBe(true);
		expect(containsId(result.recipients, client3.user!.id)).toBe(true);
	});
	it("channel-create-group-dm-with-name-successful", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);
		const client3 = await getLoggedClient(test3Credentials);

		const result = await client.channels.createDM({ recipients: [client2.user!.id, client3.user!.id], name: "test_group" });

		expect(containsId(result.recipients, client2.user!.id)).toBe(true);
		expect(containsId(result.recipients, client3.user!.id)).toBe(true);
		expect(result.ownerId).toBe(client.user!.id);
		expect(result.name).toBe("test_group");
	});
});

function containsId(recipients: APIChannelUser[], id: Snowflake | undefined) {
	return recipients.some((x) => x.id === id);
}
