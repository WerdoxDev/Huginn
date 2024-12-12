import { describe, expect, test } from "bun:test";
import {
	GatewayCode,
	type GatewayDispatch,
	type GatewayHeartbeat,
	type GatewayIdentify,
	GatewayOperations,
	type GatewayPayload,
	type GatewayResume,
} from "@huginn/shared";
import { gateway } from "#server";
import { createTestUsers, getReadyWebSocket, getWebSocket, testIsDispatch, testIsOpcode, wsSend } from "#tests/utils";

describe("Connection", () => {
	test("should close the websocket with code 4001 (UNKNOWN_OPCODE) when the sent message has an unknown op code", async (done) => {
		const { ws } = await getReadyWebSocket();

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.UNKNOWN_OPCODE);
			done();
		};

		wsSend(ws, { op: 99 });
	});

	test("should close the websocket with code 4002 (DECODE_ERROR) when sent message cannot be decoded", async (done) => {
		const { ws } = await getReadyWebSocket();

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.DECODE_ERROR);
			done();
		};

		ws.send("[123,]");
	});

	test("should close the websocket with code 4003 (NOT_AUTHENTICATED) when the websocket is not authenticated", async (done) => {
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

	test("should close the websocket with code 4004 (AUTHENTICATION_FAILED) when the authentication process fails", async (done) => {
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

	test("should close the websocket with code 4005 (ALREADY_AUTHENTICATED) when the websocket is already authenticated", async (done) => {
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

	test("should close the websocket with code 4006 (INVALID_SEQ) when the sent sequence number is invalid", async (done) => {
		const { ws } = await getReadyWebSocket();

		const heartbeatData: GatewayHeartbeat = {
			op: GatewayOperations.HEARTBEAT,
			d: 10,
		};

		ws.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.INVALID_SEQ);
			done();
		};

		wsSend(ws, heartbeatData);
	});

	test("should close the websocket with code 4009 (INVALID_SESSION) when trying to resume a non existing session", async (done) => {
		const { ws, user } = await getReadyWebSocket();
		ws.close();

		const ws2 = await getWebSocket();

		const resumeData: GatewayResume = {
			op: GatewayOperations.RESUME,
			d: { seq: 0, sessionId: "invalid", token: user.accessToken },
		};

		ws2.onmessage = (event) => {
			if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
				wsSend(ws2, resumeData);
			}
		};

		ws2.onclose = ({ code }) => {
			expect(code).toBe(GatewayCode.INVALID_SESSION);
			done();
		};
	});

	test("should resume the websocket when it is disconnected and has not recieved some messages", async (done) => {
		const { ws, readyData, user } = await getReadyWebSocket();
		ws.close();

		for (let i = 0; i < 10; i++) {
			gateway.sendToTopic(user.id.toString(), { op: GatewayOperations.DISPATCH, s: 0, d: i });
		}

		const ws2 = await getWebSocket();

		const resumeData: GatewayResume = {
			op: GatewayOperations.RESUME,
			d: { seq: 0, sessionId: readyData.sessionId, token: user.accessToken },
		};

		let recieved = 0;
		ws2.onmessage = (event) => {
			if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
				wsSend(ws2, resumeData);
			}

			if (testIsDispatch(event.data, "resumed")) {
				done();
				return;
			}

			const data = JSON.parse(event.data);
			if (testIsOpcode(event.data, GatewayOperations.DISPATCH)) {
				expect(data.d).toBe(recieved);
				recieved++;
			}
		};
	});
});
