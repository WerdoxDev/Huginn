import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("user-get-by-id", () => {
	it("user-get-by-id-invalid", async () => {
		const client = await getLoggedClient();

		expect(() => client.users.get("invalid")).toThrow("Snowflake"); // Invalid id
		expect(() => client.users.get("000000000000000000")).toThrow("Unknown User"); // Unknown id
	});
	it("user-get-by-id-successful", async () => {
		const client = await getLoggedClient();

		const result = await client.users.get(client.user?.id ?? "");

		expect(result).toBeDefined();
		expect(result).not.toHaveProperty("email");
	});
});
