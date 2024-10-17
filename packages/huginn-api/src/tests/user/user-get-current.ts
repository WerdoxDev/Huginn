import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("user-get-current", () => {
	it("user-get-current-successful", async () => {
		const client = await getLoggedClient();

		const result = await client.users.getCurrent();

		expect(result).toBeDefined();
		expect(result).toHaveProperty("email");
	});
});
