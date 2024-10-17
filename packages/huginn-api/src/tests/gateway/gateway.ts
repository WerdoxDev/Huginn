import { type GatewayIdentify, GatewayOperations } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient, testCredentials } from "../test-utils.ts";

describe("gateway", () => {
	it("gateway-not-authenticated", async () => {
		const client = await getLoggedClient(testCredentials, true);
		client.gateway.connect();

		await new Promise((r) => {
			client.gateway.on("hello", () => {
				client.gateway.send({ op: GatewayOperations.HEARTBEAT, d: 0 });
			});

			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.NOT_AUTHENTICATED);
				r(true);
			});
		});
	});
	it("gateway-already-authenticated", async () => {
		const client = await getLoggedClient(testCredentials, true);
		client.gateway.connect();

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
			let interval: Timer;
			client.gateway.on("hello", () => {
				interval = setInterval(() => {
					authenticate();
				}, 100);
			});

			client.gateway.on("close", (code) => {
				expect(code).toBe(GatewayCode.ALREADY_AUTHENTICATED);
				clearInterval(interval);
				r(true);
			});
		});
	});
	it("gateway-unknown-opcode", async () => {
		const client = await getLoggedClient(testCredentials, false);
		client.gateway.connect();

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
	it("gateway-decode-error", async () => {
		const client = await getLoggedClient(testCredentials, false);
		client.gateway.connect();

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
	it("gateway-authentication-failed", async () => {
		const client = await getLoggedClient(testCredentials, true);
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
