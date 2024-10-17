import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("common-unique-username", () => {
	it("common-unique-username-taken", async () => {
		const client = await getLoggedClient();

		const result = await client.common.uniqueUsername({ username: "test" });

		expect(result.taken).toBeTrue();
	});

	it("common-unique-username-free", async () => {
		const client = await getLoggedClient();

		const result = await client.common.uniqueUsername({ username: "a-free-username" });

		expect(result.taken).toBeFalse();
	});
});
