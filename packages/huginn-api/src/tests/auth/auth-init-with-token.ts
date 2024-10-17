import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient, getNewClient } from "../test-utils.ts";

describe("auth-init-with-token", () => {
	it("auth-init-with-token-successful", async () => {
		const client = await getLoggedClient();

		const accessToken = client.tokenHandler.token;

		const newClient = getNewClient();
		await newClient.initializeWithToken({ token: accessToken });
		await newClient.gateway.connectAndWaitForReady();

		expect(newClient.user).toBeDefined();
	});

	it("auth-init-with-refresh-token-successful", async () => {
		const client = await getLoggedClient();

		const refreshToken = client.tokenHandler.refreshToken;

		const newClient = getNewClient();
		await newClient.initializeWithToken({ refreshToken: refreshToken });
		await newClient.gateway.connectAndWaitForReady();

		expect(newClient.user).toBeDefined();
	});
});
