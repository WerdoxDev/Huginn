import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("relationship-delete", () => {
	it("relationship-delete-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.remove("invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.relationships.remove("000000000000000000")).toThrow("Unknown Relationship"); // Unknown id
	});
	it("relationship-delete-success", async () => {
		const client = await getLoggedClient();

		const relationships = await client.relationships.getAll();

		expect(() => client.relationships.remove(relationships[0].user.id)).not.toThrow();
	});
});
