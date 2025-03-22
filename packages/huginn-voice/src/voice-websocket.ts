import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { verifyVoiceToken } from "@huginn/backend-shared/voice-utils";
import {
	constants,
	GatewayCode,
	type VoiceCreateTransportData,
	type VoiceIdentifyData,
	VoiceOperations,
	type VoicePayload,
	idFix,
	validateGatewayData,
} from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { createRouter, createTransport, routers, verifyPeer } from "#mediasoup";
import type { RTCPeer } from "#utils/types";
import { ClientSession } from "./client-session";

export class VoiceWebSocket {
	private sessions: Map<string, ClientSession>;

	public constructor() {
		this.sessions = new Map();
	}

	public open(peer: Peer) {
		const helloData: VoicePayload<VoiceOperations.HELLO> = { op: VoiceOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
		this.send(peer, helloData);
	}

	public async close(peer: Peer, event: { code?: number; reason?: string }) {
		const session = this.sessions.get(peer.id);

		session?.dispose();
		this.sessions.delete(peer.id);
		console.log("cleared", peer.id);
	}

	public async message(peer: Peer, message: Message) {
		try {
			const data: VoicePayload = message.json();

			if (!validateGatewayData(data)) {
				peer.close(VoiceOperations.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			switch (data.op) {
				case VoiceOperations.HEARTBEAT:
					this.handleHeartbeat(peer);
					break;
				case VoiceOperations.IDENTIFY:
					this.handleIdentify(peer, data.d as VoiceIdentifyData);
					break;
				case VoiceOperations.CREATE_TRANSPORT:
					this.handleCreateTransport(peer, data.d as VoiceCreateTransportData);
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

	private async handleCreateTransport(peer: Peer, data: VoiceCreateTransportData) {
		const router = routers.get(data.channelId);

		if (!verifyPeer(router, peer, data.channelId)) {
			return;
		}

		const transport = await createTransport(router.router);
		const rtcPeer = router.peers.get(peer.id);
		rtcPeer?.transports.set(transport.id, { transport, direction: data.direction });

		const transportCreatedData: VoicePayload<VoiceOperations.TRANSPORT_CREATED> = {
			op: VoiceOperations.TRANSPORT_CREATED,
			d: {
				transportId: transport.id,
				direction: data.direction,
				params: {
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters,
				},
			},
		};

		this.send(peer, transportCreatedData);
	}

	private async handleIdentify(peer: Peer, data: VoiceIdentifyData) {
		const { valid, payload } = await verifyVoiceToken(data.token);

		if (!valid || !payload) {
			peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.userId, { select: selectPrivateUser }));

		const client = new ClientSession(peer);
		await client.initialize({ token: data.token, user, channelId: data.channelId, guildId: data.guildId });

		this.sessions.set(peer.id, client);

		const router = await createRouter(data.channelId);

		const rtcPeer: RTCPeer = { id: peer.id, consumers: new Map(), producers: new Map(), transports: new Map() };
		router.peers.set(peer.id, rtcPeer);

		const readyData: VoicePayload<VoiceOperations.READY> = {
			op: VoiceOperations.READY,
			d: { rtpCapabilities: router.router.rtpCapabilities },
		};

		this.send(peer, readyData);
	}

	private handleHeartbeat(peer: Peer) {
		const session = this.sessions.get(peer.id);

		session?.resetTimeout();
		const hearbeatAckData: VoicePayload<VoiceOperations.HEARTBEAT_ACK> = { op: VoiceOperations.HEARTBEAT_ACK, d: undefined };
		this.send(peer, hearbeatAckData);
	}

	private send(peer: Peer, data: unknown) {
		peer.send(JSON.stringify(data));
	}
}
