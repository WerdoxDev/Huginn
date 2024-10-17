import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("auth-logout", () => {
	it("auth-logout-success", async () => {
		const client = await getLoggedClient();

		const token = client.tokenHandler.token;

		await client.logout();

		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 1200);
		});

		client.initializeWithToken({ token });

		expect(() => client.gateway.connectAndWaitForReady()).toThrow();
	});
});
