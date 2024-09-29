import { EventEmitter } from "node:events";
import { constants } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import type { BasePayload } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import type { ServerWebSocket } from "bun";
import type { Peer } from "crossws";
import { prisma } from "#database/index";
import type { ClientSessionInfo } from "#utils/types";

export class ClientSession extends EventEmitter {
	public data: ClientSessionInfo;
	public peer: Peer;

	private sentMessages: Map<number, BasePayload>;
	private subscribedTopics: Set<string>;
	private hearbeatTimeout?: Timer;
	public sequence?: number;

	public constructor(peer: Peer, data: ClientSessionInfo) {
		super();

		this.peer = peer;
		this.data = data;
		this.sentMessages = new Map();
		this.subscribedTopics = new Set();
	}

	public initialize() {
		this.subscribeClientEvents();
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

	private async subscribeClientEvents() {
		const userId = this.data.user.id;
		this.subscribe(userId);

		const clientChannels = idFix(await prisma.channel.getUserChannels(userId, true));

		for (const channel of clientChannels) {
			this.subscribe(channel.id);
		}

		const relationshipUserIds = idFix(
			await prisma.relationship.findMany({
				where: { ownerId: BigInt(userId) },
				select: { user: { select: { id: true } } },
			}),
		).map((x) => x.user.id);

		const channelUserIds = idFix(
			await prisma.channel.findMany({
				where: { recipients: { some: { id: BigInt(userId) } } },
				select: { recipients: { where: { id: { not: BigInt(userId) } }, select: { id: true } } },
			}),
		)
			.flatMap((x) => x.recipients)
			.map((x) => x.id);

		const clientUserIds = [...new Set([...relationshipUserIds, ...channelUserIds])];

		for (const userId of clientUserIds) {
			this.subscribe(`${userId}_public`);
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
