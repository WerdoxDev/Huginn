import { afterEach, describe, expect, test } from "bun:test";
import type { APIPostLoginResult, LoginCredentials } from "@huginn/shared";
import { createTestUser, removeUsers, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("auth-login", () => {
	test("invalid form body", () => {
		const result = testHandler("/api/auth/login", {}, "POST", {});
		expect(result).rejects.toThrow("Invalid Form Body");
	});

	test("incorrect credentials", async () => {
		await createTestUser("test", "test", "test@gmail.com", "test");

		const incorrectEmail: LoginCredentials = {
			email: "incorrect",
			password: "test",
		};

		const incorrectUsername: LoginCredentials = {
			username: "incorrect",
			password: "test",
		};

		const incorrectPasswordWithEmail: LoginCredentials = {
			email: "test@gmail.com",
			password: "incorrect",
		};

		const incorrectPasswordWithUsername: LoginCredentials = {
			username: "test",
			password: "incorrect",
		};

		const result = testHandler("/api/auth/login", {}, "POST", incorrectEmail);
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/auth/login", {}, "POST", incorrectUsername);
		expect(result2).rejects.toThrow("Invalid Form Body");

		const result3 = testHandler("/api/auth/login", {}, "POST", incorrectPasswordWithEmail);
		expect(result3).rejects.toThrow("Invalid Form Body");

		const result4 = testHandler("/api/auth/login", {}, "POST", incorrectPasswordWithUsername);
		expect(result4).rejects.toThrow("Invalid Form Body");
	});

	test("with username & email", async () => {
		const user = await createTestUser("test", "test", "test@gmail.com", "test");

		const withUsername: LoginCredentials = {
			username: "test",
			password: "test",
		};

		const withEmail: LoginCredentials = {
			email: "test@gmail.com",
			password: "test",
		};

		const result = (await testHandler("/api/auth/login", {}, "POST", withUsername)) as APIPostLoginResult;
		const result2 = (await testHandler("/api/auth/login", {}, "POST", withEmail)) as APIPostLoginResult;

		expect(result?.id).toBe(user.id.toString());
		expect(result2?.id).toBe(user.id.toString());
	});
});
