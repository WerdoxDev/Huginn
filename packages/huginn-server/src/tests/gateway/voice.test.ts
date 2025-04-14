import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { ChannelType, GatewayOperations, type GatewayUpdateVoiceState, MessageType, type Snowflake } from "@huginn/shared";
import { expectCallStateExactSchema, expectVoiceServerExactSchema, expectVoiceStateExactSchema } from "#tests/expect-utils";
import {
	authHeader,
	createTestChannel,
	createTestUsers,
	getIdentifiedWebSocket,
	getReadyWebSocket,
	multiDone,
	testIsDispatch,
	wsSend,
} from "#tests/utils";

describe("Voice", () => {
	test("should receive both VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE after sending OP 6", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const tryDone = multiDone(done, 3);

		wsSend(ws, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "voice_server_update")) {
				expectVoiceServerExactSchema(data.d);
				tryDone();
			}
			if (testIsDispatch(data, "voice_state_update")) {
				expectVoiceStateExactSchema(data.d, channel.id.toString(), null, user.id.toString());
				tryDone();
			}
		};

		// Other users should also get this user's voice state update
		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "voice_state_update")) {
				expectVoiceStateExactSchema(data.d, channel.id.toString(), null, user.id.toString());
				tryDone();
			}
		};
	});

	test("should send CALL_CREATE and create call message when a channel is rang using /channels/channel.id/call/ring", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const tryDone = multiDone(done, 2);

		let messageId: Snowflake;
		ws.onmessage = ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "message_create")) {
				if (data.d.type === MessageType.CALL) {
					messageId = data.d.id;
				}
			}
			if (testIsDispatch(data, "call_create")) {
				expectCallStateExactSchema(data.d, channel.id.toString(), messageId, [user2.id.toString()]);
				tryDone();
			}
		};

		const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
		expect(result).resolves.toBe(undefined);
	});

	test("should send CALL_UPDATE when a user joins a call", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const tryDone = multiDone(done, 2);

		let messageId: Snowflake;
		ws.onmessage = ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "message_create")) {
				if (data.d.type === MessageType.CALL) {
					messageId = data.d.id;
				}
			}
			if (testIsDispatch(data, "call_update")) {
				expectCallStateExactSchema(data.d, channel.id.toString(), messageId, []);
				tryDone();
			}
		};

		wsSend(ws, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
		expect(result).resolves.toBe(undefined);

		wsSend(ws2, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);
	});

	test("should send CALL_DELETE when all users leave a call", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const tryDone = multiDone(done, 2);

		ws.onmessage = ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "call_delete")) {
				expect(data.d.channelId).toBe(channel.id.toString());
				tryDone();
			}
		};

		wsSend(ws, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
		expect(result).resolves.toBe(undefined);

		wsSend(ws2, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		wsSend(ws, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: null, guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		wsSend(ws2, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: null, guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);
	});

	test("should send VOICE_STATE_UPDATE a user leaves a call or disconnects", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const tryDone = multiDone(done, 4);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "voice_state_update")) {
				if (data.d.userId === user2.id.toString() && data.d.channelId) {
					expectVoiceStateExactSchema(data.d, channel.id.toString(), null, user2.id.toString());
					tryDone();
				} else if (data.d.userId === user2.id.toString() && !data.d.channelId) {
					expectVoiceStateExactSchema(data.d, null, null, user2.id.toString());
					tryDone();
				}
			}
		};

		wsSend(ws, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		setTimeout(() => {
			wsSend(ws2, {
				op: GatewayOperations.VOICE_STATE_UPDATE,
				d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
			} as GatewayUpdateVoiceState);
		}, 100);

		setTimeout(() => {
			wsSend(ws2, {
				op: GatewayOperations.VOICE_STATE_UPDATE,
				d: { channelId: null, guildId: null, selfDeaf: false, selfMute: false },
			} as GatewayUpdateVoiceState);
		}, 200);

		setTimeout(() => {
			wsSend(ws2, {
				op: GatewayOperations.VOICE_STATE_UPDATE,
				d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
			} as GatewayUpdateVoiceState);
		}, 300);

		setTimeout(() => {
			ws2.close();
		}, 400);
	});

	test("should send both voice states and call states in READY dispatch", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

		const { ws } = await getReadyWebSocket(user);
		// const tryDone = multiDone(done, 4);

		let messageId: Snowflake;
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "message_create")) {
				if (data.d.type === MessageType.CALL) {
					messageId = data.d.id;
				}
			}
		};

		wsSend(ws, {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: { channelId: channel.id.toString(), guildId: null, selfDeaf: false, selfMute: false },
		} as GatewayUpdateVoiceState);

		const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
		expect(result).resolves.toBe(undefined);

		const { ws: ws2 } = await getIdentifiedWebSocket(user2);
		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (testIsDispatch(data, "ready")) {
				expect(data.d.voiceStates).toHaveLength(1);
				expect(data.d.callStates).toHaveLength(1);
				expectVoiceStateExactSchema(data.d.voiceStates[0], channel.id.toString(), null, user.id.toString());
				expectCallStateExactSchema(data.d.callStates[0], channel.id.toString(), messageId, [user2.id.toString()]);
				done();
			}
		};
	});
});
