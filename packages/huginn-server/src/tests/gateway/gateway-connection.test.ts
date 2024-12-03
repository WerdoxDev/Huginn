import { describe, expect, test } from "bun:test";
import { GatewayCode, type GatewayIdentify, GatewayOperations } from "@huginn/shared";
import { createTestUsers, getIdentifiedWebSocket, getReadyWebSocket, getWebSocket, testIsDispatch, testIsOpcode, wsSend } from "#tests/utils";

describe("gateway-connection", () => {
	test("not authenticated", async (done) => {
		const ws = await getWebSocket();

		ws.onmessage = ({ data }) => {
			if (testIsOpcode(data, GatewayOperations.HELLO)) {
				// TODO: We dont have a reason to send any message that requires authentication so im sending an unkown OP but the authentication state is checked first
				wsSend(ws, { op: 99, d: 0 });
			}
		};

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.NOT_AUTHENTICATED);
			done();
		};
	});

	test("already authenticated", async (done) => {
		const [user] = await createTestUsers(1);
		const ws = await getWebSocket();

		const identifyData: GatewayIdentify = {
			op: GatewayOperations.IDENTIFY,
			d: {
				token: user.accessToken,
				intents: 0,
				properties: { os: "test", browser: "test", device: "test" },
			},
		};

		ws.onmessage = ({ data }) => {
			if (testIsOpcode(data, GatewayOperations.HELLO)) {
				wsSend(ws, identifyData);
			} else if (testIsDispatch(data, "ready")) {
				// Test
				wsSend(ws, identifyData);
			}
		};

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.ALREADY_AUTHENTICATED);
			done();
		};
	});

	test("unknown opcode", async (done) => {
		const ws = await getReadyWebSocket();

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.UNKNOWN_OPCODE);
			done();
		};

		wsSend(ws, { op: 99 });
	});

	test("decode error", async (done) => {
		const ws = await getReadyWebSocket();

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.DECODE_ERROR);
			done();
		};

		ws.send("[123,]");
	});

	test("authentication failed", async (done) => {
		const ws = await getWebSocket();

		const identifyData: GatewayIdentify = {
			op: GatewayOperations.IDENTIFY,
			d: {
				token: "",
				intents: 0,
				properties: { os: "test", browser: "test", device: "test" },
			},
		};

		ws.onmessage = ({ data }) => {
			if (testIsOpcode(data, GatewayOperations.HELLO)) {
				wsSend(ws, identifyData);
			}
		};

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.AUTHENTICATION_FAILED);
			done();
		};
	});
});
