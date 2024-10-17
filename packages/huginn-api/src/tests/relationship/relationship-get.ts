import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient, test2Credentials } from "../test-utils.ts";

describe("relationship-get", () => {
	it("relationship-get-by-id-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.get("invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.relationships.get("000000000000000000")).toThrow("Unknown Relationship"); // Unknown id
	});
	it("relationships-get-all-user", async () => {
		const client = await getLoggedClient();

		const relationships = await client.relationships.getAll();

		expect(relationships).toBeDefined();
		expect(relationships.length).toBeGreaterThan(0);
	});
	it("relationship-get-by-id-successful", async () => {
		const client = await getLoggedClient();
		const client2 = await getLoggedClient(test2Credentials);

		const relationship = await client.relationships.get(client2.user!.id);
		expect(relationship).toBeDefined();
	});
});
