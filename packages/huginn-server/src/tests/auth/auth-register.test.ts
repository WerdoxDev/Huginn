import { afterEach, describe, expect, test } from "bun:test";
import type { APIPostRegisterResult, RegisterUser } from "@huginn/shared";
import { createTestUser, removeUserLater, removeUsers, resolveAll, testHandler } from "#tests/utils";

afterEach(async () => {
	await removeUsers();
});

describe("auth-register", () => {
	test("invalid", async () => {
		const shortUsername: RegisterUser = {
			username: "t",
			displayName: "test",
			email: "test@gmail.com",
			password: "test",
		};

		const shortPassword: RegisterUser = {
			username: "test",
			displayName: "test",
			email: "test@gmail.com",
			password: "t",
		};

		const invalidEmail: RegisterUser = {
			username: "test",
			displayName: "test",
			email: "invalid",
			password: "test",
		};

		const result = testHandler("/api/auth/register", {}, "POST", {}).then(removeUserLater);
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/auth/register", {}, "POST", shortUsername).then(removeUserLater);
		expect(result2).rejects.toThrow("Invalid Form Body");

		const result3 = testHandler("/api/auth/register", {}, "POST", shortPassword).then(removeUserLater);
		expect(result3).rejects.toThrow("Invalid Form Body");

		const result4 = testHandler("/api/auth/register", {}, "POST", invalidEmail).then(removeUserLater);
		expect(result4).rejects.toThrow("Invalid Form Body");
	});

	test("existing email & username", async () => {
		await createTestUser("test", "test", "test@gmail.com", "test");

		const existingUsername: RegisterUser = {
			username: "test2",
			displayName: "test",
			email: "test@gmail.com",
			password: "test",
		};

		const existingEmail: RegisterUser = {
			username: "test",
			displayName: "test",
			email: "test2@gmail.com",
			password: "test",
		};

		const result = testHandler("/api/auth/register", {}, "POST", existingUsername).then(removeUserLater);
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/auth/register", {}, "POST", existingEmail).then(removeUserLater);
		expect(result2).rejects.toThrow("Invalid Form Body");
	});

	test("successful", async () => {
		const user: RegisterUser = {
			username: "test",
			displayName: "test",
			email: "test@gmail.com",
			password: "test",
		};

		const result = (await testHandler("/api/auth/register", {}, "POST", user).then(removeUserLater)) as APIPostRegisterResult;
		expect(result?.id).toBeDefined();
	});
});
