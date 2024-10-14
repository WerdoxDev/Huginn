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

		expect(() => client.relationships.createRelationshipByUserId(client2.user!.id)).not.toThrow();
	});
	test("relationship-accept-successful", async () => {
		const client = await getLoggedClient(test2Credentials);

		expect(() => client.relationships.createRelationship({ username: "test" })).not.toThrow();
	});
	test("relationship-create-existing-not-accepted", async () => {
		const client = await getLoggedClient(test3Credentials);
		const client2 = await getLoggedClient(test4Credentials);

		await client.relationships.createRelationship({ username: client2.user!.username });
		await client2.relationships.createRelationship({ username: client.user!.username });

		const relationship = (await client.relationships.getAll()).find(
			(x) => x.user.id === client2.user!.id && x.type === RelationshipType.FRIEND && x.since !== null,
		);
		expect(relationship).toBeDefined();
	});
	test("relationship-create-existing", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.createRelationship({ username: "test2" })).toThrow();
	});
	test(
		"relationship-create-all",
		async () => {
			const client = await getLoggedClient();
			const client2 = await getLoggedClient(test2Credentials);
			const client3 = await getLoggedClient(test3Credentials);
			const client4 = await getLoggedClient(test4Credentials);

			//expect(() => client.relationships.createRelationship({ username: "test2" })).not.toThrow(); Already done
			expect(() => client.relationships.createRelationship({ username: "test3" })).not.toThrow();
			expect(() => client.relationships.createRelationship({ username: "test4" })).not.toThrow();

			// expect(() => client2.relationships.createRelationship({ username: "test" })).not.toThrow(); Already done
			expect(() => client2.relationships.createRelationship({ username: "test3" })).not.toThrow();
			expect(() => client2.relationships.createRelationship({ username: "test4" })).not.toThrow();

			expect(() => client3.relationships.createRelationship({ username: "test" })).not.toThrow();
			expect(() => client3.relationships.createRelationship({ username: "test2" })).not.toThrow();
			// expect(() => client3.relationships.createRelationship({ username: "test4" })).not.toThrow(); Already done

			expect(() => client4.relationships.createRelationship({ username: "test" })).not.toThrow();
			expect(() => client4.relationships.createRelationship({ username: "test2" })).not.toThrow();
			// expect(() => client4.relationships.createRelationship({ username: "test3" })).not.toThrow(); Already done
		},
		{ timeout: 30000 },
	);
});
