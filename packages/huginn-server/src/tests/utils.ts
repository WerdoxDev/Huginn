import {
	constants,
	ChannelType,
	HTTPError,
	HuginnAPIError,
	type HuginnErrorData,
	MessageType,
	RelationshipType,
	type Snowflake,
	WorkerID,
	snowflake,
} from "@huginn/shared";
import type { PlainHandler, PlainRequest } from "h3";
import { prisma } from "#database";
import { startServer } from "#server";
import { envs } from "#setup";
import { createTokens } from "#utils/token-factory";

export const isCDNRunning = await checkCDNRunning();

let plainHandler: PlainHandler;
async function getServerHandler() {
	if (!plainHandler) {
		const { handler, app, router } = await startServer({ serve: false, defineOptions: true });
		app.use(router);

		plainHandler = handler;
	}

	return plainHandler;
}

export async function testHandler(
	path: PlainRequest["path"],
	headers: Record<string, string>,
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
	body?: PlainRequest["body"] | unknown,
) {
	const handler = await getServerHandler();

	let finalBody: PlainRequest["body"];
	const finalHeaders: Record<string, string> = headers;

	if (body && typeof body === "object") {
		finalHeaders["Content-Type"] = "application/json";
		finalBody = JSON.stringify(body);
	}

	const response = await handler({ path, headers: finalHeaders, method, body: finalBody });

	let responseBody: unknown;
	const headersMap = new Map(response.headers);
	if (headersMap.get("content-type")?.startsWith("application/json")) {
		responseBody = JSON.parse(response.body as string);
	}

	if (response.status >= 200 && response.status < 300) {
		return responseBody;
	}

	if (response.status >= 400 && response.status < 500) {
		const errorData = responseBody as HuginnErrorData;
		throw new HuginnAPIError(errorData, errorData.code, response.status, method, path, { body });
	}

	if (response.status >= 500 && response.status < 600) {
		throw new HTTPError(response.status, response.statusText, method, path, { body });
	}
}

export function authHeader(token: string) {
	return { Authorization: `Bearer ${token}` };
}

export async function resolveAll(...promises: Promise<unknown>[]) {
	const results = (await Promise.allSettled(promises)).map((x) => (x.status === "rejected" ? (x?.reason?.message as string) : x.value));
	return results;
}

export async function checkCDNRunning() {
	try {
		const url = envs.CDN_ROOT;
		if (!url) return false;

		const result = await fetch(url);
		return result.ok;
	} catch (e) {
		return false;
	}
}

export async function createTestUser(username: string, displayName: string, email: string, password: string) {
	const user = await prisma.user
		.create({ data: { id: snowflake.generate(WorkerID.TESTING), username, displayName, email, password, flags: 0 } })
		.then(removeUserLater);

	const [accessToken, refreshToken] = await createTokens(
		{ id: user.id.toString(), isOAuth: false },
		constants.ACCESS_TOKEN_EXPIRE_TIME,
		constants.REFRESH_TOKEN_EXPIRE_TIME,
	);
	return { ...user, accessToken, refreshToken };
}

export async function createTestRelationships(userId: bigint, user2Id: bigint, friendType?: boolean) {
	const relationship = prisma.relationship.create({
		data: {
			id: snowflake.generate(WorkerID.TESTING),
			type: friendType ? RelationshipType.FRIEND : RelationshipType.PENDING_OUTGOING,
			ownerId: userId,
			userId: user2Id,
			nickname: "",
			since: friendType ? new Date() : null,
		},
	});

	const relationship2 = prisma.relationship.create({
		data: {
			id: snowflake.generate(WorkerID.TESTING),
			type: friendType ? RelationshipType.FRIEND : RelationshipType.PENDING_INCOMING,
			ownerId: user2Id,
			userId: userId,
			nickname: "",
			since: friendType ? new Date() : null,
		},
	});

	const [userRelationship, user2Relationship] = await prisma.$transaction([relationship, relationship2]);
	return [userRelationship, user2Relationship];
}

export async function createTestChannel(ownerId: bigint | undefined, type: ChannelType, ...recipients: bigint[]) {
	const recipientsConnect = [...recipients.map((x) => ({ id: x }))];

	const channel = await prisma.channel
		.create({
			data: {
				id: snowflake.generate(WorkerID.TESTING),
				type,
				recipients: { connect: recipientsConnect },
				ownerId,
				lastMessageId: null,
				icon: null,
				name: null,
			},
			include: { recipients: true },
		})
		.then(removeChannelLater);

	for (const recipient of recipients) {
		await prisma.readState.create({ data: { userId: recipient, channelId: channel.id } });
	}

	return channel;
}

export async function createTestMessage(channelId: bigint, authorId: bigint, content: string) {
	const message = await prisma.message.create({
		data: {
			id: snowflake.generate(WorkerID.TESTING),
			content,
			channelId,
			authorId,
			type: MessageType.DEFAULT,
			createdAt: new Date(),
			pinned: false,
		},
	});

	return message;
}

export async function createManyTestMessages(channelId: bigint, authorId: bigint, amount: number) {
	const messagesTemp = [];
	for (let i = 0; i < amount; i++) {
		messagesTemp.push({
			id: snowflake.generate(WorkerID.TESTING),
			content: `test${i}`,
			channelId,
			authorId,
			type: MessageType.DEFAULT,
			createdAt: new Date(),
			pinned: false,
		});
	}

	const messages = await prisma.message.createManyAndReturn({
		data: messagesTemp,
	});

	return messages;
}

const removeUsersQueue: Snowflake[] = [];
const removeChannelsQueue: Snowflake[] = [];
const removeMessagesQueue: Snowflake[] = [];
export function removeUserLater<T>(user: T) {
	if (user && typeof user === "object" && "id" in user) {
		removeUsersQueue.push((user.id as string | bigint).toString());
	}

	return user as T;
}

export function removeChannelLater<T>(channel: T) {
	if (channel && typeof channel === "object" && "id" in channel) {
		removeChannelsQueue.push((channel.id as string | bigint).toString());
	}

	return channel as T;
}

export function removeMessageLater<T>(message: T) {
	if (message && typeof message === "object" && "id" in message) {
		removeMessagesQueue.push((message.id as string | bigint).toString());
	}

	return message as T;
}

export async function removeUsers() {
	await prisma.user.deleteMany({ where: { id: { in: removeUsersQueue.map((x) => BigInt(x)) } } });
	// await prisma.readState.deleteMany({ where: { userId: { in: removeUsersQueue.map((x) => BigInt(x)) } } });
	removeUsersQueue.splice(0, removeUsersQueue.length);
}

export async function removeChannels() {
	await prisma.readState.deleteMany({ where: { channelId: { in: removeChannelsQueue.map((x) => BigInt(x)) } } });
	await prisma.message.deleteMany({ where: { channelId: { in: removeChannelsQueue.map((x) => BigInt(x)) } } });
	await prisma.channel.deleteMany({ where: { id: { in: removeChannelsQueue.map((x) => BigInt(x)) } } });
	removeChannelsQueue.splice(0, removeChannelsQueue.length);
}

export async function removeMessages() {}
