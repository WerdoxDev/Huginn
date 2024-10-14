import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("relationship-delete", () => {
	test("relationship-delete-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.relationships.remove("invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.relationships.remove("000000000000000000")).toThrow("Unknown Relationship"); // Unknown id
	});
	test("relationship-delete-success", async () => {
		const client = await getLoggedClient();

		const relationships = await client.relationships.getAll();

		expect(() => client.relationships.remove(relationships[0].user.id)).not.toThrow();
	});
});
