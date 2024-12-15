import { describe, expect, test } from "bun:test";
import { type HuginnErrorData, JsonCode, type RequestMethod, parseResponse, resolveImage, resolveRequest } from "@huginn/shared";
import pathe from "pathe";
import { HuginnClient } from "../huginn-client";

describe("REST", () => {
	test.each(["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"])("should correctly resolve a %p request options", async (method) => {
		const resolvedRequest = await resolveRequest({
			fullRoute: "/test",
			auth: true,
			authPrefix: "Bearer",
			appendToFormData: false,
			headers: { test: "test" },
			body: method === "GET" || method === "HEAD" ? "should not be there" : "should be there",
			query: new URLSearchParams({ test: "123" }),
			token: "123",
			method: method as RequestMethod,
			root: "https://test.com",
		});

		expect(resolvedRequest).toStrictEqual({
			url: "https://test.com/test?test=123",
			fetchOptions: {
				body: method === "GET" || method === "HEAD" ? null : "should be there",
				headers: {
					test: "test",
					Authorization: "Bearer 123",
				},
				method: method,
			},
		});
	});

	test("should throw when auth is true but no token is passed", async () => {
		expect(resolveRequest({ fullRoute: "/test", method: "GET", auth: true, token: undefined, root: "https://test.com" })).rejects.toThrow();
	});

	test("should add a file to the body and correctly determine its contentType", async () => {
		const data = await resolveImage(pathe.resolve(__dirname, "./pixel.png"));
		const resolvedRequest = await resolveRequest({
			fullRoute: "/test",
			method: "POST",
			root: "https://test.com",
			files: [{ data: data!, name: "test" }],
		});

		expect(resolvedRequest).toMatchSnapshot("body file auto contentType");
	});

	test("should correctly parse response", async () => {
		const response = new Response(JSON.stringify({ test: 123 }), { headers: { "Content-Type": "application/json" } });

		const parsed = await parseResponse(response);

		expect(parsed).toStrictEqual({ test: 123 });
	});

	test("should correctly handle errors", async () => {
		const client = new HuginnClient();
		const response = new Response(JSON.stringify({ code: JsonCode.INVALID_FORM_BODY, message: "Invalid Form Body" } satisfies HuginnErrorData), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});

		expect(client._internals.rest.handleErrors(response, "POST", "https://test.com/test", { body: { test: 123 } })).rejects.toThrow(
			"Invalid Form Body",
		);
	});
});
