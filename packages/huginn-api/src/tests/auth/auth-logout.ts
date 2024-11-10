import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("auth-logout", () => {
	test("auth-logout-success", async () => {
		const client = await getLoggedClient();

		const token = client.tokenHandler.token;

		await client.logout();

		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 1200);
		});

		client.initializeWithToken({ token });

		expect(() => client.gateway.waitForReady()).toThrow();
	});
});
