import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { authHeader, createTestUsers } from "#tests/utils";
import { verifyToken } from "#utils/token-factory";

describe("POST /auth/logout", () => {
	test.skip("should invalidate the user's token", async () => {
		const [user] = await createTestUsers(1);
		const token = user.accessToken;

		await testHandler("/api/auth/logout", authHeader(token), "POST");

		const { valid, payload } = await verifyToken(token);

		expect(valid).toBeFalse();
		expect(payload).toBeFalsy();
	});
});
