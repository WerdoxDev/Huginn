import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import type { APIPostRegisterResult, RegisterUser } from "@huginn/shared";
import { expectPrivateUserExactSchema } from "#tests/expect-utils";
import { createTestUsers, removeUserLater } from "#tests/utils";

describe("POST /auth/register", () => {
	test("should return 'Invalid Form Body' when body constrains are not met", async () => {
		const shortUsername: RegisterUser = {
			username: "t",
			displayName: "test01",
			email: "test01@gmail.com",
			password: "test01",
		};

		const shortPassword: RegisterUser = {
			username: "test02",
			displayName: "test02",
			email: "test02@gmail.com",
			password: "t",
		};

		const invalidEmail: RegisterUser = {
			username: "test03",
			displayName: "test03",
			email: "invalid",
			password: "test03",
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

	test("should return 'Invalid Form Body' when username or email already exists", async () => {
		const [user] = await createTestUsers(1);

		const existingUsername: RegisterUser = {
			username: user.username,
			displayName: user.displayName,
			email: `test${user.id}@gmail.com`,
			password: user.password ?? "",
		};

		const existingEmail: RegisterUser = {
			username: `test${user.id}`,
			displayName: user.displayName,
			email: user.email,
			password: user.password ?? "",
		};

		const result = testHandler("/api/auth/register", {}, "POST", existingUsername).then(removeUserLater);
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/auth/register", {}, "POST", existingEmail).then(removeUserLater);
		expect(result2).rejects.toThrow("Invalid Form Body");
	});

	test("should created a user when the request is successful", async () => {
		const user: RegisterUser = {
			username: "test04",
			displayName: "test04",
			email: "test04@gmail.com",
			password: "test04",
		};

		const result = (await testHandler("/api/auth/register", {}, "POST", user).then(removeUserLater)) as APIPostRegisterResult;
		expectPrivateUserExactSchema(result);
	});
});
