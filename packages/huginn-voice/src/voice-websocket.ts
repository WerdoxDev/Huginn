import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { verifyVoiceToken } from "@huginn/backend-shared/voice-utils";
import {
	constants,
	GatewayCode,
	type VoiceConnectTransportData,
	type VoiceConsumeData,
	type VoiceCreateTransportData,
	type VoiceIdentifyData,
	VoiceOperations,
	type VoicePayload,
	type VoiceProduceData,
	type VoiceResumeConsumerData,
	idFix,
	validateGatewayData,
} from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { ws } from "#index";
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

		const router = Array.from(routers.values()).find((x) => x.peers.has(peer.id));

		if (router) {
			const rtcPeer = router.peers.get(peer.id);

			if (!rtcPeer) {
				return;
			}

			for (const [_, transportData] of rtcPeer.transports) {
				transportData.transport.close();
			}

			router.peers.delete(peer.id);
			const producerIds = Array.from(rtcPeer.producers.values().map((x) => x.id));

			for (const [otherPeerId] of router.peers) {
				const peerLeftData: VoicePayload<VoiceOperations.PEER_LEFT> = { op: VoiceOperations.PEER_LEFT, d: { peerId: peer.id, producerIds } };
				ws.publish(otherPeerId, JSON.stringify(peerLeftData));
			}

			// If room is empty, close it
			if (router.peers.size === 0) {
				router.router.close();
				routers.delete(router.channelId);
				console.log("room closed", router.channelId);
			}
		}

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
					await this.handleIdentify(peer, data.d as VoiceIdentifyData);
					break;
				case VoiceOperations.CREATE_TRANSPORT:
					await this.handleCreateTransport(peer, data.d as VoiceCreateTransportData);
					break;
				case VoiceOperations.CONNECT_TRANSPORT:
					await this.handleConnectTransport(peer, data.d as VoiceConnectTransportData);
					break;
				case VoiceOperations.PRODUCE:
					await this.handleProduce(peer, data.d as VoiceProduceData);
					break;
				case VoiceOperations.CONSUME:
					await this.handleConsume(peer, data.d as VoiceConsumeData);
					break;
				case VoiceOperations.RESUME_CONSUMER:
					await this.handleResumeConsumer(peer, data.d as VoiceResumeConsumerData);
					break;
			}
		} catch (e) {
			if (e instanceof SyntaxError) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			console.log(e);

			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	private async handleResumeConsumer(peer: Peer, data: VoiceResumeConsumerData) {
		const router = routers.get(data.channelId);

		if (!verifyPeer(router, peer, data.channelId)) {
			return;
		}

		const rtcPeer = router.peers.get(peer.id);
		const consumer = rtcPeer?.consumers.get(data.consumerId);

		if (!consumer) {
			return;
		}

		await consumer.resume();

		const consumerResumedData: VoicePayload<VoiceOperations.CONSUMER_RESUMED> = {
			op: VoiceOperations.CONSUMER_RESUMED,
			d: { consumerId: data.consumerId },
		};

		this.send(peer, consumerResumedData);
	}

	private async handleConsume(peer: Peer, data: VoiceConsumeData) {
		const router = routers.get(data.channelId);

		if (!verifyPeer(router, peer, data.channelId)) {
			return;
		}

		const rtcPeer = router.peers.get(peer.id);
		const producerPeer = router.peers.values().find((x) => x.producers.values().find((y) => y.id === data.producerId));
		const transportData = rtcPeer?.transports.get(data.transportId);

		if (!rtcPeer || !producerPeer) {
			return;
		}

		if (!transportData || transportData.direction !== "recv") {
			console.log("transport null or wrong type");
			return;
		}

		if (!router.router.canConsume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities })) {
			console.log("router cant consume");
			return;
		}

		const consumer = await transportData.transport.consume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities, paused: true });
		rtcPeer?.consumers.set(consumer.id, consumer);

		const consumerCreatedData: VoicePayload<VoiceOperations.CONSUMER_CREATED> = {
			op: VoiceOperations.CONSUMER_CREATED,
			d: {
				consumerId: consumer.id,
				producerId: data.producerId,
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
				producerUserId: producerPeer.userId,
			},
		};

		this.send(peer, consumerCreatedData);
	}

	private async handleProduce(peer: Peer, data: VoiceProduceData) {
		const router = routers.get(data.channelId);

		if (!verifyPeer(router, peer, data.channelId)) {
			return;
		}

		const rtcPeer = router.peers.get(peer.id);
		const transportData = rtcPeer?.transports.get(data.transportId);

		if (!transportData || transportData.direction !== "send" || !rtcPeer) {
			return;
		}

		const producer = await transportData.transport.produce({ kind: data.kind, rtpParameters: data.rtpParameters });
		rtcPeer?.producers.set(producer.id, producer);

		for (const [otherPeerId] of router.peers) {
			if (otherPeerId !== peer.id) {
				const newProducerData: VoicePayload<VoiceOperations.NEW_PRODUCER> = {
					op: VoiceOperations.NEW_PRODUCER,
					d: { kind: data.kind, producerId: producer.id, producerUserId: rtcPeer.userId },
				};
				ws.publish(otherPeerId, JSON.stringify(newProducerData));
			}
		}

		const producerCreatedData: VoicePayload<VoiceOperations.PRODUCER_CREATED> = {
			op: VoiceOperations.PRODUCER_CREATED,
			d: { producerId: producer.id },
		};

		this.send(peer, producerCreatedData);
	}

	private async handleConnectTransport(peer: Peer, data: VoiceConnectTransportData) {
		const router = routers.get(data.channelId);

		if (!verifyPeer(router, peer, data.channelId)) {
			return;
		}

		const rtcPeer = router.peers.get(peer.id);
		const transportData = rtcPeer?.transports.get(data.transportId);

		if (!transportData) {
			return;
		}

		await transportData.transport.connect({ dtlsParameters: data.dtlsParameters });

		const transportConnectedData: VoicePayload<VoiceOperations.TRANSPORT_CONNECTED> = {
			op: VoiceOperations.TRANSPORT_CONNECTED,
			d: { transportId: transportData.transport.id },
		};

		this.send(peer, transportConnectedData);
	}

	private async handleCreateTransport(peer: Peer, data: VoiceCreateTransportData) {
		const router = routers.get(data.channelId);

		if (!verifyPeer(router, peer, data.channelId)) {
			return;
		}

		const transport = await createTransport(router.router);
		console.log(JSON.stringify(transport.iceCandidates, null, 2));
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

		const rtcPeer: RTCPeer = { id: peer.id, consumers: new Map(), producers: new Map(), transports: new Map(), userId: user.id };
		router.peers.set(peer.id, rtcPeer);

		const producers = Array.from(
			router.peers
				.values()
				.map((x) => Array.from(x.producers.values().map((y) => ({ producerId: y.id, producerUserId: x.userId, kind: y.kind })))),
		).flat();

		const readyData: VoicePayload<VoiceOperations.READY> = {
			op: VoiceOperations.READY,
			d: { rtpCapabilities: router.router.rtpCapabilities, producers },
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
