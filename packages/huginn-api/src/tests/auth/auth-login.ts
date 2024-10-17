import type { LoginCredentials } from "@huginn/shared";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getNewClient, testCredentials } from "../test-utils.ts";

describe("auth-login", () => {
	it("auth-login-invalid", () => {
		const client = getNewClient();

		expect(() => client.login({} as LoginCredentials)).toThrow("Invalid Form Body");
	});

	it("auth-login-with-username", async () => {
		const client = getNewClient();

		const user: LoginCredentials = {
			username: "test",
			password: "test",
		};

		await client.login(user);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});

	it("auth-login-with-email", async () => {
		const client = getNewClient();

		const user: LoginCredentials = {
			email: "test@gmail.com",
			password: "test",
		};

		await client.login(user);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});

	it("auth-login-successful", async () => {
		const client = getNewClient();

		await client.login(testCredentials);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});
});
