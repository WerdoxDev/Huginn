import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { verifyVoiceToken } from "@huginn/backend-shared/voice-utils";
import {
	constants,
	GatewayCode,
	type VoiceHello,
	type VoiceIdentify,
	VoiceOperations,
	type VoicePayload,
	idFix,
	validateGatewayData,
} from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { ClientSession } from "./client-session";

export class VoiceWebSocket {
	// public constructor() {}

	public open(peer: Peer) {
		const helloData: VoiceHello = { op: VoiceOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
		this.send(peer, helloData);
	}

	public async close(peer: Peer, event: { code?: number; reason?: string }) {}

	public async message(peer: Peer, message: Message) {
		try {
			const data: VoicePayload = message.json();

			if (!validateGatewayData(data)) {
				peer.close(VoiceOperations.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			switch (data.op) {
				case VoiceOperations.IDENTIFY:
					this.handleIdentify(peer, data as VoiceIdentify);
					break;
			}
		} catch (e) {
			if (e instanceof SyntaxError) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	private async handleIdentify(peer: Peer, data: VoiceIdentify) {
		const { valid, payload } = await verifyVoiceToken(data.d.token);

		if (!valid || !payload) {
			peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.userId, { select: selectPrivateUser }));

		const client = new ClientSession(peer);
		await client.initialize({ token: data.d.token, user });

		console.log(user);
	}

	private send(peer: Peer, data: unknown) {
		// logGatewaySend(peer.id, data as WebsocketPayload, this.options.logHeartbeat);

		peer.send(JSON.stringify(data));
	}
}
