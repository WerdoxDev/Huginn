import { createVoiceToken } from "@huginn/backend-shared";
import { logGatewayClose, logGatewayOpen, logGatewayRecieve, logGatewaySend, logServerError } from "@huginn/backend-shared/log-utils";
import { constants, type APIReadStateWithoutUser, type GatewayUpdateVoiceState, type UserSettings, WorkerID, merge } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import {
	type GatewayHeartbeat,
	type GatewayHeartbeatAck,
	type GatewayHello,
	type GatewayIdentify,
	GatewayOperations,
	type GatewayPayload,
	type GatewayResume,
} from "@huginn/shared";
import { type Snowflake, snowflake } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { omitChannelRecipient, omitRelationshipUserIds, selectChannelRecipients, selectPrivateUser, selectRelationshipUser } from "#database/common";
import { prisma } from "#database/index";
import { verifyToken } from "#utils/token-factory";
import type { ServerGatewayOptions } from "#utils/types";
import { dispatchToTopic, validateGatewayData } from "../utils/gateway-utils";
import { ClientSession } from "./client-session";
import { PresenceManager } from "./presence-manager";

export class ServerGateway {
	private readonly options: ServerGatewayOptions;
	private clients: Map<string, ClientSession>;
	private cancelledClientDisconnects: string[];
	public presenceManeger: PresenceManager;

	public constructor(options: ServerGatewayOptions) {
		this.options = options;
		this.clients = new Map<string, ClientSession>();
		this.presenceManeger = new PresenceManager();
		this.cancelledClientDisconnects = [];
	}

	public open(peer: Peer) {
		try {
			logGatewayOpen(peer.remoteAddress);

			// We create an uninitialized client only for oauth and keeping an eye for it's heartbeat
			const client = new ClientSession(peer);
			this.clients.set(peer.id, client);

			const helloData: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL, peerId: peer.id } };
			this.send(peer, helloData);
		} catch (e) {
			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	public async close(peer: Peer, event: { code?: number; reason?: string }) {
		this.deleteUninitializedClient(peer.id);

		const client = this.getSessionByPeerId(peer.id);

		if (client?.data) {
			this.presenceManeger.removeClient(client.data.user.id);
		}

		client?.dispose();

		if (client?.data && event.code === GatewayCode.INVALID_SESSION) {
			this.clients.delete(client.data.sessionId);
		} else if (client?.data) {
			this.queueClientDisconnect(client.data.sessionId);
		}

		logGatewayClose(event.code || 0, event.reason || "");
	}

	public async message(peer: Peer, message: Message) {
		try {
			const data: GatewayPayload = message.json();

			if (!validateGatewayData(data)) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			const session = this.getSessionByPeerId(peer.id);
			logGatewayRecieve(session?.data?.sessionId ?? peer.id, data, this.options.logHeartbeat);

			let needsAuthentication = false;

			switch (data.op) {
				case GatewayOperations.IDENTIFY:
					await this.handleIdentify(peer, data as GatewayIdentify);
					break;
				case GatewayOperations.HEARTBEAT:
					this.handleHeartbeat(peer, data as GatewayHeartbeat);
					break;
				case GatewayOperations.RESUME:
					await this.handleResume(peer, data as GatewayResume);
					break;
				default:
					needsAuthentication = true;
			}

			if (needsAuthentication && !session?.data) {
				peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
				return;
			}

			if (!needsAuthentication) {
				return;
			}

			switch (data.op) {
				case GatewayOperations.VOICE_STATE_UPDATE:
					this.handleUpdateVoiceState(peer, data as GatewayUpdateVoiceState);
					break;
				default:
					peer.close(GatewayCode.UNKNOWN_OPCODE, "UNKNOWN_OPCODE");
			}
		} catch (e) {
			if (e instanceof SyntaxError) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			logServerError("/gateway", e as Error);
			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	public subscribeSessionsToTopic(userId: Snowflake, topic: string) {
		const sessions = Array.from(this.clients.entries())
			.filter((x) => x[1].data?.user.id === userId)
			.map((x) => x[1]);
		for (const session of sessions) {
			session.subscribe(topic);
		}
	}

	public unsubscribeSessionsFromTopic(userId: Snowflake, topic: string) {
		const sessions = Array.from(this.clients.entries())
			.filter((x) => x[1].data?.user.id === userId)
			.map((x) => x[1]);
		for (const session of sessions) {
			session.unsubscribe(topic);
		}
	}

	public getSessionsCount() {
		return this.clients.size;
	}

	public getSessionByPeerId(peerId: string) {
		for (const [_sessionId, client] of this.clients) {
			if (client.peer.id === peerId) {
				return client;
			}
		}
	}

	public getSessionByKey(key: string) {
		return this.clients.get(key);
	}

	public sendToTopic(topic: string, data: GatewayPayload) {
		for (const client of this.clients.values()) {
			if (client.isSubscribed(topic)) {
				const newData = { ...data, s: client.increaseSequence() };
				client.addMessage(newData);
				client.peer.send(JSON.stringify(newData));
			}
		}
	}

	private handleHeartbeat(peer: Peer, data: GatewayHeartbeat) {
		const client = this.getSessionByPeerId(peer.id);

		// if (client && data.d !== client?.sequence) {
		// 	peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
		// 	return;
		// }

		client?.resetTimeout();
		const hearbeatAckData: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
		this.send(peer, hearbeatAckData);
	}

	private async handleIdentify(peer: Peer, data: GatewayIdentify) {
		const { valid, payload } = await verifyToken(data.d.token);

		if (!valid || !payload) {
			peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
			return;
		}

		if (this.getSessionByPeerId(peer.id) && !this.clients.get(peer.id)) {
			peer.close(GatewayCode.ALREADY_AUTHENTICATED, "ALREADY_AUTHENTICATED");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.id, { select: selectPrivateUser }));
		const sessionId = snowflake.generateString(WorkerID.GATEWAY);

		// The uninitialized client is stored using it's peer_id instead of session_id
		// We will delete this client and initialize a new one with proper session id
		this.deleteUninitializedClient(peer.id);

		const client = new ClientSession(peer);
		await client.initialize({ user, sessionId, ...data.d.properties });
		this.clients.set(sessionId, client);

		// Relationships
		const userRelationships = idFix(
			await prisma.relationship.getUserRelationships(user.id, { include: selectRelationshipUser, omit: omitRelationshipUserIds }),
		);

		// Channels
		const userChannels = idFix(
			await prisma.channel.getUserChannels(user.id, false, { include: merge(selectChannelRecipients, omitChannelRecipient(user.id)) }),
		);

		// Presences
		const presences = this.presenceManeger.getUserPresences(client);

		// Read states
		const dbReadStates = idFix(await prisma.readState.getUserStates(user.id));
		const finalReadStates: APIReadStateWithoutUser[] = [];

		for (const readState of dbReadStates) {
			finalReadStates.push({
				channelId: readState.channelId,
				lastReadMessageId: readState.lastReadMessageId,
				unreadCount: await prisma.readState.countUnreadMessages(readState.userId, readState.channelId),
			});
		}

		// Settings
		//TODO: ADD ACTUAL PROPER SETTINGS
		const settings: UserSettings = { status: "online" };

		const readyData: GatewayPayload<"ready"> = {
			op: GatewayOperations.DISPATCH,
			d: {
				user,
				sessionId: sessionId,
				privateChannels: userChannels,
				relationships: userRelationships,
				userSettings: settings,
				presences,
				readStates: finalReadStates,
			},
			t: "ready",
			s: client.increaseSequence(),
		};

		this.send(peer, readyData);

		this.presenceManeger.setClient(user, client, settings);
	}

	private async handleResume(peer: Peer, data: GatewayResume) {
		const { valid, payload } = await verifyToken(data.d.token);

		if (!valid || !payload) {
			peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
			return;
		}

		if (!this.clients.has(data.d.sessionId)) {
			peer.close(GatewayCode.INVALID_SESSION, "INVALID_SESSION");
			return;
		}

		const client = this.clients.get(data.d.sessionId);

		if (!client) {
			throw new Error("client was null in handleResume");
		}

		if (client.sequence === undefined || data.d.seq > client.sequence) {
			peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.id, { select: { id: true } }));

		this.deleteUninitializedClient(peer.id);

		client.peer = peer;
		client.initialize(client.data);

		this.cancelledClientDisconnects.push(data.d.sessionId);

		const messageQueue = client.getMessages();

		for (const [seq, _data] of messageQueue) {
			if (seq <= data.d.seq) {
				continue;
			}

			this.send(peer, _data);
		}

		const resumedData: GatewayPayload<"resumed"> = {
			t: "resumed",
			op: GatewayOperations.DISPATCH,
			d: undefined,
			s: client.increaseSequence(),
		};

		this.send(peer, resumedData);
		this.presenceManeger.setClient(user, client, { status: "online" });
	}

	private async handleUpdateVoiceState(peer: Peer, data: GatewayUpdateVoiceState) {
		const client = this.getSessionByPeerId(peer.id);
		const user = client?.data?.user;

		if (!client || !user) {
			return;
		}

		dispatchToTopic(user.id, "voice_state_update", { userId: user.id, channelId: data.d.channelId, guildId: data.d.guildId });

		const token = await createVoiceToken(user.id);
		dispatchToTopic(user.id, "voice_server_update", { token, sessionId: snowflake.generateString(WorkerID.GATEWAY), hostname: "127.0.0.1" });
	}

	private deleteUninitializedClient(peerId: string) {
		const uninitializedClient = this.clients.get(peerId);
		uninitializedClient?.dispose();
		this.clients.delete(peerId);
	}

	private queueClientDisconnect(sessionId: Snowflake) {
		setTimeout(() => {
			if (this.cancelledClientDisconnects.includes(sessionId)) {
				this.cancelledClientDisconnects = this.cancelledClientDisconnects.filter((x) => x !== sessionId);
				return;
			}

			this.clients.delete(sessionId);
		}, 1000 * 60);
	}

	private send(peer: Peer, data: unknown) {
		logGatewaySend(peer.id, data as GatewayPayload, this.options.logHeartbeat);

		peer.send(JSON.stringify(data));
	}
}
