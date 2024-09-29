import { logGatewayClose, logGatewayOpen, logGatewayRecieve, logGatewaySend, logServerError } from "@huginn/backend-shared";
import { constants, WorkerID } from "@huginn/shared";
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
import type { ServerWebSocket } from "bun";
import consola from "consola";
import type { Message, Peer } from "crossws";
import crossws, { type BunAdapter } from "crossws/adapters/bun";
import { prisma } from "#database/index";
import { verifyToken } from "#utils/token-factory";
import type { ServerGatewayOptions } from "#utils/types";
import { validateGatewayData } from "../utils/gateway-utils";
import { ClientSession } from "./client-session";

export class ServerGateway {
	private readonly options: ServerGatewayOptions;
	private clients: Map<string, ClientSession>;
	private cancelledClientDisconnects: string[];
	public ws: BunAdapter;

	public constructor(options: ServerGatewayOptions) {
		this.options = options;
		this.clients = new Map<string, ClientSession>();
		this.cancelledClientDisconnects = [];

		this.ws = crossws({ hooks: { open: this.open.bind(this), close: this.close.bind(this), message: this.message.bind(this) } });
	}

	private open(peer: Peer) {
		try {
			logGatewayOpen();

			const helloData: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
			this.send(peer, helloData);
		} catch (e) {
			peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
		}
	}

	private close(peer: Peer, details: { code?: number; reason?: string }) {
		const client = this.getSessionByPeerId(peer.id);

		client?.dispose();

		if (client && details.code === GatewayCode.INVALID_SESSION) {
			this.clients.delete(client.data.sessionId);
		} else if (client) {
			this.queueClientDisconnect(client.data.sessionId);
		}

		logGatewayClose(details.code || 0, details.reason || "");
	}

	private async message(peer: Peer, message: Message) {
		try {
			// if (typeof message !== "string") {
			// 	consola.error("Non string message type is not supported yet");
			// 	return;
			// }

			const data: BasePayload = message.json();

			if (!validateGatewayData(data)) {
				peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
				return;
			}

			logGatewayRecieve(data, this.options.logHeartbeat);

			// Identify
			if (isOpcode<GatewayIdentify>(data, GatewayOperations.IDENTIFY)) {
				await this.handleIdentify(peer, data);
				// Resume
			} else if (isOpcode<GatewayResume>(data, GatewayOperations.RESUME)) {
				this.handleResume(peer, data);
				// Not authenticated
			} else if (!this.getSessionByPeerId(peer.id)) {
				peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
				return;
				// Heartbeat
			} else if (isOpcode<GatewayHeartbeat>(data, GatewayOperations.HEARTBEAT)) {
				this.handleHeartbeat(peer, data);
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
			.filter((x) => x[1].data.user.id === userId)
			.map((x) => x[1]);
		for (const session of sessions) {
			session.subscribe(topic);
		}
	}

	public unsubscribeSessionsToTopic(userId: Snowflake, topic: string) {
		const sessions = Array.from(this.clients.entries())
			.filter((x) => x[1].data.user.id === userId)
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

		if (data.d !== client?.sequence) {
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

		if (this.getSessionByPeerId(peer.id)) {
			peer.close(GatewayCode.ALREADY_AUTHENTICATED, "ALREADY_AUTHENTICATED");
			return;
		}

		const user = idFix(await prisma.user.getById(payload.id));
		const sessionId = snowflake.generateString(WorkerID.GATEWAY);

		const client = new ClientSession(peer, { user, sessionId });
		client.initialize();
		this.clients.set(sessionId, client);

		const readyData: GatewayReadyDispatch = {
			op: GatewayOperations.DISPATCH,
			d: { user, sessionId: sessionId },
			t: "ready",
			s: client.increaseSequence(),
		};

		this.send(peer, readyData);
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

		if (!client) throw new Error("client was null in handleIdentify");

		if (!client.sequence || data.d.seq > client.sequence) {
			peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
			return;
		}

		client.peer = peer;
		client.initialize();

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
	}

	private queueClientDisconnect(sessionId: Snowflake) {
		setTimeout(() => {
			if (this.cancelledClientDisconnects.includes(sessionId)) {
				return;
			}

			this.clients.delete(sessionId);
		}, 1000 * 30);
	}

	private send(peer: Peer, data: unknown) {
		logGatewaySend(data as BasePayload, this.options.logHeartbeat);

		peer.send(JSON.stringify(data));
	}
}
