import { beforeAll, describe, expect, test } from "bun:test";
import { RelationshipType } from "@huginn/shared";
import { url, getLoggedClient, test2Credentials, test3Credentials, test4Credentials } from "../test-utils";

beforeAll(async () => {
	await fetch(`http://${url}/api/test/test-relationships`, { method: "POST" });
});

describe("relationship-create", () => {
	test("relationship-create-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.createRelationship({} as { username: string })).toThrow("Invalid Form Body");
	});
	test("relationship-create-empty-username", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.createRelationship({ username: "" })).toThrow("Invalid Form Body");
	});
	test("relationship-create-self-request", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.createRelationship({ username: "test" })).toThrow();
	});
	test("relationship-create-username-successful", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.createRelationship({ username: "test2" })).not.toThrow();
	});
	test("relationship-create-userid-successful", async () => {
		const client = await getLoggedClient(test2Credentials);
		const client2 = await getLoggedClient(test3Credentials);

		expect(client2.user).toBeDefined();
		if (!client2.user) return;

		expect(() => client.relationships.createRelationshipByUserId(client2.user.id)).not.toThrow();
	});
	test("relationship-accept-successful", async () => {
		const client = await getLoggedClient(test2Credentials);

		expect(() => client.relationships.createRelationship({ username: "test" })).not.toThrow();
	});
	test("relationship-create-existing-not-accepted", async () => {
		const client = await getLoggedClient(test3Credentials);
		const client2 = await getLoggedClient(test4Credentials);

		expect(client.user).toBeDefined();
		expect(client2.user).toBeDefined();
		if (!client.user || !client2.user) return;

		await client.relationships.createRelationship({ username: client2.user.username });
		await client2.relationships.createRelationship({ username: client.user.username });

		const relationship = (await client.relationships.getAll()).find(
			(x) => x.user.id === client2.user.id && x.type === RelationshipType.FRIEND && x.since !== null,
		);
		expect(relationship).toBeDefined();
	});
	test("relationship-create-existing", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.createRelationship({ username: "test2" })).toThrow();
	});
});
