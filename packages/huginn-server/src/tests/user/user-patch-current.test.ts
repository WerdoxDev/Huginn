import { describe, expect, test } from "bun:test";
import { type APIPatchCurrentUserJSONBody, type APIPatchCurrentUserResult, resolveImage } from "@huginn/shared";
import pathe from "pathe";
import { authHeader, createTestUsers, isCDNRunning, testHandler } from "#tests/utils";

describe("user-patch-current", () => {
	test("invalid", async () => {
		const [user] = await createTestUsers(1);

		const emptyUsername: APIPatchCurrentUserJSONBody = {
			username: "",
			password: user.password ?? "",
		};

		const shortUsername: APIPatchCurrentUserJSONBody = {
			username: "t",
			password: user.password ?? "",
		};

		const shortNewPassword: APIPatchCurrentUserJSONBody = {
			password: user.password ?? "",
			newPassword: "t",
		};

		const invalidEmail: APIPatchCurrentUserJSONBody = {
			email: "invalid",
		};

		const incorrectPassword: APIPatchCurrentUserJSONBody = {
			newPassword: "new-password",
			password: "incorrect",
		};

		const result = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", emptyUsername);
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", shortUsername);
		expect(result2).rejects.toThrow("Invalid Form Body");

		const result3 = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", shortNewPassword);
		expect(result3).rejects.toThrow("Invalid Form Body");

		const result4 = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", invalidEmail);
		expect(result4).rejects.toThrow("Invalid Form Body");

		const result5 = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", incorrectPassword);
		expect(result5).rejects.toThrow("Invalid Form Body");
	});

	test("existing username & email", async () => {
		const [user, user2] = await createTestUsers(2);

		const existingUsername: APIPatchCurrentUserJSONBody = {
			username: user2.username,
		};

		const existingEmail: APIPatchCurrentUserJSONBody = {
			email: user2.email,
		};

		const result = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", existingUsername);
		expect(result).rejects.toThrow("Invalid Form Body");

		const result2 = testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", existingEmail);
		expect(result2).rejects.toThrow("Invalid Form Body");
	});

	test("empty displayName", async () => {
		const [user] = await createTestUsers(1);

		const edit: APIPatchCurrentUserJSONBody = {
			displayName: "",
		};

		const result = (await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", edit)) as APIPatchCurrentUserResult;

		expect(result?.id).toBe(user.id.toString());
		expect(result.displayName).toBeNull();
	});

	test("successful", async () => {
		const [user] = await createTestUsers(1);

		const edit: Required<APIPatchCurrentUserJSONBody> = {
			displayName: "test-edited",
			email: "test-edited@gmail.com",
			username: "test_edited",
			newPassword: "test-edited",
			password: user.password ?? "",
			avatar: null,
		};

		const result = (await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", edit)) as APIPatchCurrentUserResult;

		expect(result?.id).toBe(user.id.toString());
		expect(result.displayName).toBe(edit.displayName);
		expect(result.email).toBe(edit.email);
		expect(result.username).toBe(edit.username);
		expect(result.password).toBe(edit.newPassword);
		expect(result.avatar).toBe(edit.avatar);
	});

	test.skipIf(!isCDNRunning)("avatar successful", async () => {
		const [user] = await createTestUsers(1);

		const image = await resolveImage(pathe.resolve(__dirname, "../pixel.png"));
		const result = (await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", {
			avatar: image,
		})) as APIPatchCurrentUserResult;

		expect(result?.id).toBe(user.id.toString());
		expect(result.avatar).toBeDefined();
		expect(result.avatar).toHaveLength(32);
	});
});
