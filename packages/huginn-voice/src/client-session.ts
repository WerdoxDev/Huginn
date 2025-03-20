import { EventEmitter } from "node:events";
import { constants } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import type { GatewayPayload } from "@huginn/shared";
import type { Peer } from "crossws";
import type { ClientSessionInfo } from "#utils/types";

export class ClientSession extends EventEmitter {
	public sessionInfo?: ClientSessionInfo;
	public peer: Peer;

	private sentMessages: Map<number, GatewayPayload>;
	private hearbeatTimeout?: NodeJS.Timeout;
	public sequence?: number;

	public constructor(peer: Peer) {
		super();

		this.peer = peer;
		this.sentMessages = new Map();

		this.startHeartbeatTimeout();
	}

	public async initialize(sessionInfo?: ClientSessionInfo) {
		this.sessionInfo = sessionInfo;
		await this.subscribeClientEvents();

		if (!this.hearbeatTimeout) {
			this.startHeartbeatTimeout();
		}
	}

	public resetTimeout() {
		clearTimeout(this.hearbeatTimeout);
		this.startHeartbeatTimeout();
	}

	public dispose() {
		clearTimeout(this.hearbeatTimeout);
		this.removeAllListeners();
	}

	public subscribe(topic: string) {
		this.peer.subscribe(topic);
	}

	public unsubscribe(topic: string) {
		this.peer.unsubscribe(topic);
	}

	public isSubscribed(topic: string) {
		return this.peer.topics.has(topic);
	}

	public getIncreasedSequence() {
		this.sequence = this.sequence !== undefined ? this.sequence + 1 : 0;
		return this.sequence;
	}

	public addMessage(data: GatewayPayload) {
		this.sentMessages.set(data.s, data);
	}

	public getMessages() {
		return this.sentMessages;
	}

	public getSubscriptions() {
		return this.peer.topics;
	}

	private async subscribeClientEvents() {
		if (!this.sessionInfo) {
			throw new Error("Client session was not initialized");
		}

		const userId = this.sessionInfo.user.id;
		this.subscribe(userId);
	}

	private startHeartbeatTimeout() {
		const tolerance = 3000;

		this.hearbeatTimeout = setTimeout(() => {
			this.emit("timeout", this.sessionInfo);
			this.dispose();
			this.peer.close(GatewayCode.SESSION_TIMEOUT, "SESSION_TIMEOUT");
		}, constants.HEARTBEAT_INTERVAL + tolerance);
	}
}
