import { describe, expect, test } from "bun:test";
import { type GatewayIdentify, GatewayOperations } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import { getLoggedClient, testCredentials } from "../test-utils";

describe("gateway", () => {
	test("gateway-not-authenticated", async () => {
		const client = await getLoggedClient(testCredentials);
		client.gateway.connect();

		await new Promise((r) => {
			client.gateway.on("hello", () => {
				// TODO: We dont have a reason to send any message that requires authentication so im sending an unkown OP but the authentication state is checked first
				client.gateway.send({ op: 99, d: 0 });
			});

			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.NOT_AUTHENTICATED);
				r(true);
			});
		});
	});
	test("gateway-already-authenticated", async () => {
		const client = await getLoggedClient(testCredentials);
		client.gateway.connect();
		await client.gateway.identify();

		function authenticate() {
			const identifyData: GatewayIdentify = {
				op: GatewayOperations.IDENTIFY,
				d: {
					token: client.tokenHandler.token ?? "",
					intents: client.options.intents,
					properties: { os: "windows", browser: "idk", device: "idk" },
				},
			};
			client.gateway.send(identifyData);
		}

		await new Promise((r) => {
			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.ALREADY_AUTHENTICATED);
				r(true);
			});

			setTimeout(() => {
				authenticate();
			}, 1000);
		});
	});
	test("gateway-unknown-opcode", async () => {
		const client = await getLoggedClient(testCredentials);
		client.gateway.connect();
		await client.gateway.identify();

		await new Promise((r) => {
			client.gateway.on("ready", () => {
				client.gateway.send({ op: 99 });
			});

			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.UNKNOWN_OPCODE);
				r(true);
			});
		});
	});
	test("gateway-decode-error", async () => {
		const client = await getLoggedClient(testCredentials);
		client.gateway.connect();
		await client.gateway.identify();

		await new Promise((r) => {
			client.gateway.on("ready", () => {
				client.gateway.send("[123,]");
			});

			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.DECODE_ERROR);
				r(true);
			});
		});
	});
	test("gateway-authentication-failed", async () => {
		const client = await getLoggedClient(testCredentials);
		client.gateway.connect();

		await new Promise((r) => {
			client.gateway.on("hello", () => {
				const identifyData: GatewayIdentify = {
					op: GatewayOperations.IDENTIFY,
					d: {
						token: "",
						intents: client.options.intents,
						properties: { os: "windows", browser: "idk", device: "idk" },
					},
				};

				client.gateway.send(identifyData);
			});

			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.AUTHENTICATION_FAILED);
				r(true);
			});
		});
	});
});
