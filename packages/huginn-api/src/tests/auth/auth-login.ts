import { describe, expect, test } from "bun:test";
import type { LoginCredentials } from "@huginn/shared";
import { getNewClient, testCredentials } from "../test-utils";

describe("auth-login", () => {
	test("auth-login-invalid", () => {
		const client = getNewClient();

		expect(() => client.login({} as LoginCredentials)).toThrow("Invalid Form Body");
	});

	test("auth-login-with-username", async () => {
		const client = getNewClient();

		const user: LoginCredentials = {
			username: "test",
			password: "test",
		};

		await client.login(user);
		await client.gateway.waitForReady();

		expect(client.user).toBeDefined();
	});

	test("auth-login-with-email", async () => {
		const client = getNewClient();

		const user: LoginCredentials = {
			email: "test@gmail.com",
			password: "test",
		};

		await client.login(user);
		await client.gateway.waitForReady();

		expect(client.user).toBeDefined();
	});

	test("auth-login-successful", async () => {
		const client = getNewClient();

		await client.login(testCredentials);
		await client.gateway.waitForReady();

		expect(client.user).toBeDefined();
	});
});
