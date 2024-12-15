import { describe, expect, test } from "bun:test";
import { generateRandomString } from "@huginn/shared";
import { encodeBase64 } from "@std/encoding";
import type { PlainResponse } from "h3";
import { testHandler } from "#tests/utils";

describe("GET /auth/google", () => {
	test("should return '404' when query params are not correct", async () => {
		const result = testHandler("/api/auth/google", {}, "GET", {});
		expect(result).rejects.toThrow("Not Found");
	});

	test("should return 'Forbidden' when state is not valid or the timestamp is expired or redirect_url is not allowed", async () => {
		const result = testHandler(
			`/api/auth/google?${new URLSearchParams({ redirect_url: "https://app.huginn.dev/", state: "123", flow: "browser" }).toString()}`,
			{},
			"GET",
		);
		expect(result).rejects.toThrow("Forbidden");

		const state = encodeBase64(`${Date.now() - 6 * 60 * 1000}:${generateRandomString(16)}`);
		const result2 = testHandler(
			`/api/auth/google?${new URLSearchParams({ redirect_url: "https://app.huginn.dev/", state: state, flow: "browser" }).toString()}`,
			{},
			"GET",
		);
		expect(result2).rejects.toThrow("Forbidden");

		const state2 = encodeBase64(`${Date.now()}:${generateRandomString(16)}`);
		const result3 = testHandler(
			`/api/auth/google?${new URLSearchParams({ redirect_url: "https://invalid.com", state: state2, flow: "browser" }).toString()}`,
			{},
			"GET",
		);
		expect(result3).rejects.toThrow("Forbidden");
	});

	test("should return a valid google oauth2 url when the request is successful", async () => {
		const state = encodeBase64(`${Date.now()}:${generateRandomString(16)}`);

		const result = (await testHandler(
			`/api/auth/google?${new URLSearchParams({ redirect_url: "https://app.huginn.dev/", state: state, flow: "browser" }).toString()}`,
			{},
			"GET",
		)) as PlainResponse;

		expect(result.status).toBe(302);
		expect(result.headers[1][1]).toInclude("https://accounts.google.com/o/oauth2");
	});
});
