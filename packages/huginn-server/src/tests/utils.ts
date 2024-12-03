import {
	constants,
	type ChannelType,
	type DataPayload,
	GatewayCode,
	type GatewayEvents,
	type GatewayIdentify,
	type GatewayOperationTypes,
	GatewayOperations,
	HTTPError,
	HuginnAPIError,
	type HuginnErrorData,
	MessageType,
	RelationshipType,
	type Snowflake,
	WorkerID,
	isOpcode,
	snowflake,
} from "@huginn/shared";
import type { Server } from "bun";
import type { PlainHandler, PlainRequest } from "h3";
import { unknown } from "zod";
import { prisma } from "#database";
import { startServer } from "#server";
import { envs } from "#setup";
import { createTokens } from "#utils/token-factory";

export const isCDNRunning = await checkCDNRunning();

let plainHandler: PlainHandler;
async function getServerHandler(serve: boolean) {
	if (!plainHandler) {
		const { handler, app, router } = await startServer({ serve: serve, defineOptions: true });
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
	const handler = await getServerHandler(true);

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

export async function getWebSocket() {
	await getServerHandler(true);
	const ws = new WebSocket(`ws://${envs.SERVER_HOST}:${envs.SERVER_PORT}/gateway`);
	return ws;
}

export function wsSend(ws: WebSocket, data: unknown) {
	if (typeof data === "object") {
		ws.send(JSON.stringify(data));
	} else if (typeof data === "string") {
		ws.send(data);
	}
}

export async function getReadyWebSocket() {
	const [user] = await createTestUsers(1);
	const ws = await getIdentifiedWebSocket();

	await new Promise((r) => {
		ws.onmessage = (event) => {
			if (testIsDispatch(event.data, "ready")) {
				// Test
				r(true);
			}
		};
	});

	return ws;
}

export async function getIdentifiedWebSocket() {
	const [user] = await createTestUsers(1);
	const ws = await getWebSocket();

	const identifyData: GatewayIdentify = {
		op: GatewayOperations.IDENTIFY,
		d: {
			token: user.accessToken,
			intents: 0,
			properties: { os: "test", browser: "test", device: "test" },
		},
	};

	await new Promise((r) => {
		ws.onmessage = (event) => {
			if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
				wsSend(ws, identifyData);
				r(true);
			}
		};
	});

	return ws;
}

export function testIsOpcode<O extends keyof GatewayOperationTypes>(data: unknown, opcode: O): data is GatewayOperationTypes[O] {
	if (typeof data !== "string") {
		return false;
	}

	const parsedData = JSON.parse(data);
	if (isOpcode(parsedData, opcode)) {
		return true;
	}

	return false;
}

export function testIsDispatch<E extends keyof GatewayEvents>(data: unknown, eventType: E): data is GatewayEvents[E] {
	if (testIsOpcode(data, GatewayOperations.DISPATCH)) {
		const parsedData: DataPayload<E> = JSON.parse(data as unknown as string);
		if (parsedData.t === eventType) {
			// biome-ignore lint/style/noParameterAssign: i am reassigning the event.data here for better test writing
			data = parsedData;
			return true;
		}
	}

	return false;
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

export const timeSpent = {
	createUsers: 0,
	deleteUsers: 0,
	createRelationships: 0,
	createChannels: 0,
	deleteChannels: 0,
	createMessages: 0,
	deleteMessages: 0,
	deleteReadStates: 0,
};

const currentIndecies = { users: 0, channels: 0, relationships: 0, messages: 0 };

export async function createTestUsers(amount: number) {
	const t0 = performance.now();

	const users = [];
	for (let i = 0; i < amount; i++) {
		const index = currentIndecies.users + i;
		users.push({
			id: snowflake.generate(WorkerID.TESTING),
			username: `test${index}`,
			displayName: `test${index}`,
			email: `test${index}@gmail.com`,
			password: `test${index}`,
			flags: 0,
		});
	}

	currentIndecies.users += amount;

	const createdUsers = await prisma.user.createManyAndReturn({ data: users });

	const t1 = performance.now();
	timeSpent.createUsers += t1 - t0;

	return await Promise.all(
		createdUsers.map(async (x) => {
			const [accessToken, refreshToken] = await createTokens(
				{ id: x.id.toString(), isOAuth: false },
				constants.ACCESS_TOKEN_EXPIRE_TIME,
				constants.REFRESH_TOKEN_EXPIRE_TIME,
			);

			removeUserLater(x);

			return { ...x, accessToken, refreshToken };
		}),
	);
}

export async function createTestRelationships(userId: bigint, user2Id: bigint, friendType?: boolean) {
	const t0 = performance.now();
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

	const t1 = performance.now();
	timeSpent.createRelationships += t1 - t0;

	return [userRelationship, user2Relationship];
}

export async function createTestChannel(ownerId: bigint | undefined, type: ChannelType, ...recipients: bigint[]) {
	const t0 = performance.now();
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

	await prisma.readState.createMany({ data: recipients.map((x) => ({ userId: x, channelId: channel.id })) });

	const t1 = performance.now();
	timeSpent.createChannels += t1 - t0;

	return channel;
}

export async function createTestMessages(channelId: bigint, authorId: bigint, amount: number) {
	const t0 = performance.now();

	const messages = [];
	for (let i = 0; i < amount; i++) {
		messages.push({
			id: snowflake.generate(WorkerID.TESTING),
			content: `test${i}`,
			channelId,
			authorId,
			type: MessageType.DEFAULT,
			createdAt: new Date(),
			pinned: false,
		});
	}

	const createdMessages = await prisma.message.createManyAndReturn({
		data: messages,
	});

	const t1 = performance.now();
	timeSpent.createMessages += t1 - t0;

	return createdMessages;
}

const removeUsersQueue: bigint[] = [];
const removeChannelsQueue: bigint[] = [];

export function removeUserLater<T>(user: T) {
	if (user && typeof user === "object" && "id" in user) {
		removeUsersQueue.push(BigInt(user.id as string));
	}

	return user as T;
}

export function removeChannelLater<T>(channel: T) {
	if (channel && typeof channel === "object" && "id" in channel) {
		removeChannelsQueue.push(BigInt(channel.id as string));
	}

	return channel as T;
}

export async function removeUsers() {
	const t0 = performance.now();
	await prisma.user.deleteMany({ where: { id: { in: removeUsersQueue } } });
	removeUsersQueue.splice(0, removeUsersQueue.length);

	const t1 = performance.now();
	timeSpent.deleteUsers += t1 - t0;
}

export async function removeChannels() {
	let t0 = 0;
	let t1 = 0;

	t0 = performance.now();
	await prisma.readState.deleteMany({ where: { channelId: { in: removeChannelsQueue } } });

	t1 = performance.now();
	timeSpent.deleteReadStates += t1 - t0;

	t0 = performance.now();
	await prisma.message.deleteMany({ where: { channelId: { in: removeChannelsQueue } } });

	t1 = performance.now();
	timeSpent.deleteMessages += t1 - t0;

	t0 = performance.now();
	await prisma.channel.deleteMany({ where: { id: { in: removeChannelsQueue } } });

	t1 = performance.now();
	timeSpent.deleteChannels += t1 - t0;

	removeChannelsQueue.splice(0, removeChannelsQueue.length);
}
