import { logGatewayClose, logGatewayOpen, logGatewayRecieve, logGatewaySend, logServerError } from "@huginn/backend-shared";
import { constants, type UserSettings, WorkerID, merge } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import {
	type BasePayload,
	type GatewayHeartbeat,
	type GatewayHeartbeatAck,
	type GatewayHello,
	type GatewayIdentify,
	GatewayOperations,
	type GatewayReadyDispatch,
	type GatewayResume,
	type GatewayResumedData,
} from "@huginn/shared";
import { type Snowflake, snowflake } from "@huginn/shared";
import { idFix, isOpcode } from "@huginn/shared";
import type { Message, Peer } from "crossws";
import crossws, { type BunAdapter } from "crossws/adapters/bun";
import { excludeChannelRecipient, includeChannelRecipients, includeRelationshipUser } from "#database/common";
import { prisma } from "#database/index";
import { verifyToken } from "#utils/token-factory";
import type { ServerGatewayOptions } from "#utils/types";
import { validateGatewayData } from "../utils/gateway-utils";
import { ClientSession } from "./client-session";
import { PresenceManager } from "./presence-manager";

export class ServerGateway {
	private readonly options: ServerGatewayOptions;
	private clients: Map<string, ClientSession>;
	private cancelledClientDisconnects: string[];
	public presenceManeger: PresenceManager;
	public internalWS: BunAdapter;

	public constructor(options: ServerGatewayOptions) {
		this.options = options;
		this.clients = new Map<string, ClientSession>();
		this.presenceManeger = new PresenceManager();
		this.cancelledClientDisconnects = [];

		this.internalWS = crossws({ hooks: { open: this.open.bind(this), close: this.close.bind(this), message: this.message.bind(this) } });
	}

	private open(peer: Peer) {
		try {
			logGatewayOpen();

			// We create an uninitialized client only for oauth and keeping an eye for it's heartbeat
			const client = new ClientSession(peer);
			this.clients.set(peer.id, client);

			const helloData: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL, peerId: peer.id } };
			this.send(peer, helloData);
		} catch (e) {
			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	private async close(peer: Peer, details: { code?: number; reason?: string }) {
		this.deleteUninitializedClient(peer.id);

		const client = this.getSessionByPeerId(peer.id);

		if (client?.data) {
			this.presenceManeger.removeClient(client.data.user.id);
		}

		client?.dispose();

		if (client?.data && details.code === GatewayCode.INVALID_SESSION) {
			this.clients.delete(client.data.sessionId);
		} else if (client?.data) {
			this.queueClientDisconnect(client.data.sessionId);
		}

		logGatewayClose(details.code || 0, details.reason || "");
	}

	private async message(peer: Peer, message: Message) {
		try {
			const data: BasePayload = message.json();

			if (!validateGatewayData(data)) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			const session = this.getSessionByPeerId(peer.id);
			logGatewayRecieve(session?.data?.sessionId ?? peer.id, data, this.options.logHeartbeat);

			// Identify
			if (isOpcode<GatewayIdentify>(data, GatewayOperations.IDENTIFY)) {
				await this.handleIdentify(peer, data);
				// Resume
			} else if (isOpcode<GatewayResume>(data, GatewayOperations.RESUME)) {
				this.handleResume(peer, data);
				// Heartbeat
			} else if (isOpcode<GatewayHeartbeat>(data, GatewayOperations.HEARTBEAT)) {
				this.handleHeartbeat(peer, data);
				// -- Not authenticated --
			} else if (!session?.data) {
				peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
				return;
			} else {
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

	public sendToTopic(topic: string, data: BasePayload) {
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

		if (client && data.d !== client?.sequence) {
			peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
			return;
		}

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

		const user = idFix(await prisma.user.getById(payload.id));
		const sessionId = snowflake.generateString(WorkerID.GATEWAY);

		// The uninitialized client is stored using it's peer_id instead of session_id
		// We will delete this client and initialize a new one with proper session id
		this.deleteUninitializedClient(peer.id);

		const client = new ClientSession(peer);
		await client.initialize({ user, sessionId, ...data.d.properties });
		this.clients.set(sessionId, client);

		const userRelationships = idFix(await prisma.relationship.getUserRelationships(user.id, includeRelationshipUser));
		const userChannels = idFix(
			await prisma.channel.getUserChannels(user.id, false, merge(includeChannelRecipients, excludeChannelRecipient(user.id))),
		);

		const presences = this.presenceManeger.getUserPresences(client);

		//TODO: ADD ACTUAL PROPER SETTINGS
		const settings: UserSettings = { status: "online" };

		const readyData: GatewayReadyDispatch = {
			op: GatewayOperations.DISPATCH,
			d: { user, sessionId: sessionId, privateChannels: userChannels, relationships: userRelationships, userSettings: settings, presences },
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

		if (!client.sequence || data.d.seq > client.sequence) {
			peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.id));

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

		const resumedData: GatewayResumedData = {
			t: "resumed",
			op: GatewayOperations.DISPATCH,
			d: undefined,
			s: client.increaseSequence(),
		};

		this.send(peer, resumedData);
		this.presenceManeger.setClient(user, client, { status: "online" });
	}

	private deleteUninitializedClient(peerId: string) {
		const uninitializedClient = this.clients.get(peerId);
		uninitializedClient?.dispose();
		this.clients.delete(peerId);
	}

	private queueClientDisconnect(sessionId: Snowflake) {
		setTimeout(() => {
			if (this.cancelledClientDisconnects.includes(sessionId)) {
				this.cancelledClientDisconnects = this.cancelledClientDisconnects.filter((x) => x === sessionId);
				return;
			}

			this.clients.delete(sessionId);
		}, 1000 * 60);
	}

	private send(peer: Peer, data: unknown) {
		logGatewaySend(peer.id, data as BasePayload, this.options.logHeartbeat);

		peer.send(JSON.stringify(data));
	}
}
