import { EventEmitter } from "node:events";
import { constants, RelationshipType, merge } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import type { GatewayPayload } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import type { Peer } from "crossws";
import { omitChannelRecipient, selectChannelRecipients, selectRelationshipUser } from "#database/common";
import { prisma } from "#database/index";
import type { ClientSessionInfo } from "#utils/types";

export class ClientSession extends EventEmitter {
	public data?: ClientSessionInfo;
	public peer: Peer;

	private sentMessages: Map<number, GatewayPayload>;
	private subscribedTopics: Set<string>;
	private hearbeatTimeout?: Timer;
	public sequence?: number;

	public constructor(peer: Peer) {
		super();

		this.peer = peer;
		this.sentMessages = new Map();
		this.subscribedTopics = new Set();

		this.startHeartbeatTimeout();
	}

	public async initialize(data?: ClientSessionInfo) {
		this.data = data;
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

	public addMessage(data: GatewayPayload) {
		this.sentMessages.set(data.s, data);
	}

	public getMessages() {
		return this.sentMessages;
	}

	public getSubscriptions() {
		return this.subscribedTopics;
	}

	private async subscribeClientEvents() {
		if (!this.data) {
			throw new Error("Client session was not initialized");
		}

		const userId = this.data.user.id;
		this.subscribe(userId);

		const relationships = idFix(await prisma.relationship.getUserRelationships(userId, { select: { ...selectRelationshipUser, type: true } }));
		const channels = idFix(
			await prisma.channel.getUserChannels(userId, true, {
				select: { ...merge(selectChannelRecipients, omitChannelRecipient(userId)), id: true },
			}),
		);

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
