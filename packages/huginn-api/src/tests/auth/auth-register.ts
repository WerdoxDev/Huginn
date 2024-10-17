import type { RegisterUser } from "@huginn/shared";
import { expect } from "@std/expect";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { url, getNewClient } from "../test-utils.ts";

beforeAll(async () => {
	await fetch(`http://${url}/api/test/test-users`, { method: "POST" });
});

describe("auth-register", () => {
	it("auth-register-invalid", () => {
		const client = getNewClient();
		expect(() => client.register({} as RegisterUser)).toThrow("Invalid Form Body");
	});

	it("auth-register-short-username-password", () => {
		const client = getNewClient();

		const user: RegisterUser = {
			username: "t",
			displayName: "test",
			email: "test@gmail.com",
			password: "t",
		};

		expect(() => client.register(user)).toThrow("Invalid Form Body");
	});

	it("auth-register-successful", async () => {
		const client = getNewClient();

		const user: RegisterUser = {
			username: "test",
			displayName: "test",
			email: "test@gmail.com",
			password: "test",
		};

		await client.register(user);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});

	it("auth-register-repeated-invalid", () => {
		const client = getNewClient();

		const user: RegisterUser = {
			username: "test",
			displayName: "test",
			email: "test@gmail.com",
			password: "test",
		};

		expect(() => client.register(user)).toThrow("Invalid Form Body");
	});

	it("auth-register-second-successful", async () => {
		const client = getNewClient();

		const user: RegisterUser = {
			username: "test2",
			displayName: "test2",
			email: "test2@gmail.com",
			password: "test2",
		};

		await client.register(user);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});

	it("auth-register-third-successful", async () => {
		const client = getNewClient();

		const user: RegisterUser = {
			username: "test3",
			displayName: "test3",
			email: "test3@gmail.com",
			password: "test3",
		};

		await client.register(user);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});
	it("auth-register-fourth-successful", async () => {
		const client = getNewClient();

		const user: RegisterUser = {
			username: "test4",
			displayName: "test4",
			email: "test4@gmail.com",
			password: "test4",
		};

		await client.register(user);
		await client.gateway.connectAndWaitForReady();

		expect(client.user).toBeDefined();
	});
});
