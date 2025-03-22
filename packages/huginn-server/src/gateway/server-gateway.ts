import { createVoiceToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import {
	omitChannelRecipient,
	omitRelationshipUserIds,
	selectChannelRecipients,
	selectPrivateUser,
	selectRelationshipUser,
} from "@huginn/backend-shared/database/common";
import { logGatewayClose, logGatewayOpen, logGatewayRecieve, logGatewaySend, logServerError } from "@huginn/backend-shared/log-utils";
import {
	constants,
	type APIReadStateWithoutUser,
	type GatewayPayload,
	type GatewayUpdateVoiceState,
	type UserSettings,
	WorkerID,
	merge,
	validateGatewayData,
} from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import {
	type GatewayHeartbeat,
	type GatewayHeartbeatAck,
	type GatewayHello,
	type GatewayIdentify,
	GatewayOperations,
	type GatewayResume,
} from "@huginn/shared";
import { type Snowflake, snowflake } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { verifyToken } from "#utils/token-factory";
import type { ServerGatewayOptions } from "#utils/types";
import { dispatchToTopic } from "../utils/gateway-utils";
import { ClientSession } from "./client-session";
import { PresenceManager } from "./presence-manager";

export class ServerGateway {
	private readonly options: ServerGatewayOptions;
	private sessions: Map<string, ClientSession>;
	private cancelledClientDisconnects: string[];
	public presenceManeger: PresenceManager;

	public constructor(options: ServerGatewayOptions) {
		this.options = options;
		this.sessions = new Map<string, ClientSession>();
		this.presenceManeger = new PresenceManager();
		this.cancelledClientDisconnects = [];
	}

	public open(peer: Peer) {
		try {
			logGatewayOpen(peer.remoteAddress);

			// We create an uninitialized client only for oauth and keeping an eye for it's heartbeat
			const client = new ClientSession(peer);
			this.sessions.set(peer.id, client);

			const helloData: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL, sessionId: peer.id } };
			this.send(peer, helloData);
		} catch (e) {
			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	public async close(peer: Peer, event: { code?: number; reason?: string }) {
		const session = this.sessions.get(peer.id);

		if (session?.sessionInfo) {
			this.presenceManeger.removeUserPresence(session.sessionInfo.user.id);
		}

		session?.dispose();

		if (session?.sessionInfo && event.code === GatewayCode.INVALID_SESSION) {
			this.sessions.delete(peer.id);
		} else if (session?.sessionInfo) {
			this.queueClientDisconnect(peer.id);
		}

		logGatewayClose(event.code || 0, event.reason || "");
	}

	public async message(peer: Peer, message: Message) {
		try {
			peer.id;
			const data: GatewayPayload = message.json();

			if (!validateGatewayData(data)) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			const session = this.sessions.get(peer.id);
			logGatewayRecieve(peer.id, data, this.options.logHeartbeat);

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

			if (needsAuthentication && !session?.sessionInfo) {
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
		for (const [sessionId, session] of this.sessions) {
			if (session.sessionInfo?.user.id === userId) {
				session.subscribe(topic);
			}
		}
	}

	public unsubscribeSessionsFromTopic(userId: Snowflake, topic: string) {
		for (const [sessionId, session] of this.sessions) {
			if (session.sessionInfo?.user.id === userId) {
				session.unsubscribe(topic);
			}
		}
	}

	public getSessionsCount() {
		return this.sessions.size;
	}

	public getSessionByKey(key: string) {
		return this.sessions.get(key);
	}

	public sendToTopic(topic: string, data: GatewayPayload) {
		for (const client of this.sessions.values()) {
			if (client.isSubscribed(topic)) {
				const newData = { ...data, s: client.getIncreasedSequence() };
				client.addMessage(newData);
				client.peer.send(JSON.stringify(newData));
			}
		}
	}

	private handleHeartbeat(peer: Peer, data: GatewayHeartbeat) {
		const session = this.sessions.get(peer.id);

		session?.resetTimeout();
		const hearbeatAckData: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
		this.send(peer, hearbeatAckData);
	}

	private async handleIdentify(peer: Peer, data: GatewayIdentify) {
		const { valid, payload } = await verifyToken(data.d.token);

		if (!valid || !payload) {
			peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
			return;
		}

		if (this.sessions.get(peer.id)?.sessionInfo) {
			peer.close(GatewayCode.ALREADY_AUTHENTICATED, "ALREADY_AUTHENTICATED");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.id, { select: selectPrivateUser }));

		const session = this.sessions.get(peer.id);

		if (!session) {
			throw new Error("session was null in handleIdentify");
		}

		await session.initialize({ user, sessionId: peer.id, ...data.d.properties });

		// Relationships
		const userRelationships = idFix(
			await prisma.relationship.getUserRelationships(user.id, { include: selectRelationshipUser, omit: omitRelationshipUserIds }),
		);

		// Channels
		const userChannels = idFix(
			await prisma.channel.getUserChannels(user.id, false, { include: merge(selectChannelRecipients, omitChannelRecipient(user.id)) }),
		);

		// Presences
		const presences = this.presenceManeger.getUserPresences(session);

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
				privateChannels: userChannels,
				relationships: userRelationships,
				userSettings: settings,
				presences,
				readStates: finalReadStates,
			},
			t: "ready",
			s: session.getIncreasedSequence(),
		};

		this.send(peer, readyData);

		this.presenceManeger.setUserPresence(user, session, settings);
	}

	private async handleResume(peer: Peer, data: GatewayResume) {
		const { valid, payload } = await verifyToken(data.d.token);

		if (!valid || !payload) {
			peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
			return;
		}

		const session = this.sessions.get(data.d.sessionId);

		if (!session || !session.sessionInfo) {
			peer.close(GatewayCode.INVALID_SESSION, "INVALID_SESSION");
			return;
		}

		if (session.sequence === undefined || data.d.seq > session.sequence) {
			peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.id, { select: selectPrivateUser }));

		session.peer = peer;
		await session.initialize({ ...session.sessionInfo, sessionId: peer.id, user });

		// Add new peer
		this.sessions.set(peer.id, session);
		// Remove the old one
		this.sessions.delete(data.d.sessionId);

		this.cancelledClientDisconnects.push(data.d.sessionId);

		const messageQueue = session.getMessages();

		for (const [seq, _data] of messageQueue) {
			if (seq <= data.d.seq) {
				continue;
			}

			this.send(peer, _data);
		}

		const resumedData: GatewayPayload<"resumed"> = {
			t: "resumed",
			op: GatewayOperations.DISPATCH,
			d: { sessionId: peer.id },
			s: session.getIncreasedSequence(),
		};

		this.send(peer, resumedData);
		this.presenceManeger.setUserPresence(user, session, { status: "online" });
	}

	private async handleUpdateVoiceState(peer: Peer, data: GatewayUpdateVoiceState) {
		const session = this.sessions.get(peer.id);
		const user = session?.sessionInfo?.user;

		if (!session || !user) {
			return;
		}

		dispatchToTopic(user.id, "voice_state_update", { userId: user.id, channelId: data.d.channelId, guildId: data.d.guildId });

		const token = await createVoiceToken(user.id);
		dispatchToTopic(user.id, "voice_server_update", { token, hostname: "127.0.0.1" });
	}

	private queueClientDisconnect(sessionId: Snowflake) {
		setTimeout(() => {
			if (this.cancelledClientDisconnects.includes(sessionId)) {
				this.cancelledClientDisconnects = this.cancelledClientDisconnects.filter((x) => x !== sessionId);
				return;
			}

			this.sessions.delete(sessionId);
		}, 1000 * 60);
	}

	private send(peer: Peer, data: unknown) {
		logGatewaySend(peer.id, data as GatewayPayload, this.options.logHeartbeat);

		peer.send(JSON.stringify(data));
	}
}
