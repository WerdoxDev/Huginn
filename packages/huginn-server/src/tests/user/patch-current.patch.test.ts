import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIPatchCurrentUserJSONBody, type APIPatchCurrentUserResult, getFileHash, resolveImage, toArrayBuffer } from "@huginn/shared";
import pathe from "pathe";
import { expectUserExactSchema } from "#tests/expect-utils";
import { authHeader, createTestUsers, isCDNRunning } from "#tests/utils";

describe("PATCH /users/@me", () => {
	test("should return 'Invalid Form Body' when body constrains are not met", async () => {
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

	test("should return 'Unauthorized' when no token is passed", async () => {
		await createTestUsers(1);

		// No token
		const result = testHandler("/api/users/@me", {}, "PATCH");
		expect(result).rejects.toThrow("Unauthorized");
	});

	test("should return 'Invalid Form Body' when the username or email is already in use", async () => {
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

	test("should set the displayName to 'null' when the request is successful", async () => {
		const [user] = await createTestUsers(1);

		const edit: APIPatchCurrentUserJSONBody = {
			displayName: "",
		};

		const result = (await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", edit)) as APIPatchCurrentUserResult;

		expectUserExactSchema(result, user.id, user.username, null, user.avatar, user.flags, user.email, user.password, true);
	});

	test("should edit the current user when the request is successful", async () => {
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

		expectUserExactSchema(result, user.id, edit.username, edit.displayName, null, user.flags, edit.email, edit.newPassword, true);
	});

	test.skipIf(!isCDNRunning)("should change the user's avatar when the request is successful", async () => {
		const [user] = await createTestUsers(1);

		const avatarData = await resolveImage(pathe.resolve(__dirname, "../pixel.png"));
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const avatarHash = getFileHash(toArrayBuffer(avatarData!));

		const result = (await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", {
			avatar: avatarData,
		})) as APIPatchCurrentUserResult;

		expectUserExactSchema(result, user.id, user.username, user.displayName, avatarHash, user.flags, user.email, user.password, true);
	});
});
