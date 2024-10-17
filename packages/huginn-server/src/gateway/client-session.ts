import { EventEmitter } from "node:events";
import { constants, RelationshipType, merge } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import type { BasePayload } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import type { Peer } from "crossws";
import { excludeChannelRecipient, includeChannelRecipients, includeRelationshipUser } from "../database/common.ts";
import { prisma } from "../database/index.ts";
import type { ClientSessionInfo } from "../utils/types.ts";

export class ClientSession extends EventEmitter {
	public data: ClientSessionInfo;
	public peer: Peer;

	private sentMessages: Map<number, BasePayload>;
	private subscribedTopics: Set<string>;
	private hearbeatTimeout?: number;
	public sequence?: number;

	public constructor(peer: Peer, data: ClientSessionInfo) {
		super();

		this.peer = peer;
		this.data = data;
		this.sentMessages = new Map();
		this.subscribedTopics = new Set();
	}

	public async initialize() {
		await this.subscribeClientEvents();
		this.startHeartbeatTimeout();
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
		if (!this.isSubscribed(topic)) {
			this.subscribedTopics.add(topic);
		}
	}

	public unsubscribe(topic: string) {
		if (this.isSubscribed(topic)) {
			this.subscribedTopics.delete(topic);
		}
	}

	public isSubscribed(topic: string) {
		return this.subscribedTopics.has(topic);
	}

	public increaseSequence() {
		this.sequence = this.sequence !== undefined ? this.sequence + 1 : 0;
		return this.sequence;
	}

	public addMessage(data: BasePayload) {
		this.sentMessages.set(data.s, data);
	}

	public getMessages() {
		return this.sentMessages;
	}

	public getSubscriptions() {
		return this.subscribedTopics;
	}

	private async subscribeClientEvents() {
		const userId = this.data.user.id;
		this.subscribe(userId);

		const relationships = idFix(await prisma.relationship.getUserRelationships(userId, includeRelationshipUser));
		const channels = idFix(await prisma.channel.getUserChannels(userId, true, merge(includeChannelRecipients, excludeChannelRecipient(userId))));

		const publicUserIds = [...new Set([...relationships.map((x) => x.user.id), ...channels.flatMap((x) => x.recipients).map((x) => x.id)])];
		const presenceUserIds = [...new Set([...relationships.filter((x) => x.type === RelationshipType.FRIEND).map((x) => x.user.id)])];

		for (const channel of channels) {
			this.subscribe(channel.id);
		}

		// Users from Relationships
		for (const userId of publicUserIds) {
			this.subscribe(`${userId}_public`);
		}

		for (const userId of presenceUserIds) {
			this.subscribe(`${userId}_presence`);
		}
	}

	private startHeartbeatTimeout() {
		const tolerance = 3000;

		this.hearbeatTimeout = setTimeout(() => {
			this.emit("timeout", this.data);
			this.dispose();
			this.peer.close(GatewayCode.SESSION_TIMEOUT, "SESSION_TIMEOUT");
		}, constants.HEARTBEAT_INTERVAL + tolerance);
	}
}
