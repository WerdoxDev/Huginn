import {
	constants,
	type APIChannelUser,
	type APIUser,
	type ChannelType,
	type GatewayEvents,
	type GatewayIdentify,
	type GatewayOperationTypes,
	GatewayOperations,
	type GatewayPayload,
	type GatewayReadyData,
	MessageType,
	RelationshipType,
	type Snowflake,
	WorkerID,
	isOpcode,
	snowflake,
} from "@huginn/shared";
import { prisma } from "#database";
import { envs } from "#setup";
import { createTokens } from "#utils/token-factory";

export const isCDNRunning = await checkCDNRunning();
export type TestUser = Omit<APIUser, "id"> & { id: bigint; accessToken: string; refreshToken: string };

const connectedWebsockets: WebSocket[] = [];
const currentIndecies = { users: 0, channels: 0, relationships: 0, messages: 0 };

const removeUsersQueue: bigint[] = [];
const removeChannelsQueue: bigint[] = [];

export async function getWebSocket() {
	const ws = new WebSocket("ws://localhost:3004/gateway");
	connectedWebsockets.push(ws);
	return ws;
}

export function wsSend(ws: WebSocket, data: unknown) {
	if (typeof data === "object") {
		ws.send(JSON.stringify(data));
	} else if (typeof data === "string") {
		ws.send(data);
	}
}

export async function getReadyWebSocket(user?: TestUser) {
	let finalUser = user;
	if (!finalUser) {
		finalUser = (await createTestUsers(1))[0];
	}

	const ws = await getIdentifiedWebSocket(finalUser);

	const readyData = await new Promise<GatewayReadyData>((resolve, reject) => {
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "ready")) {
				resolve(data.d);
			}
		};

		ws.onclose = ({ code }) => {
			reject(code);
		};
	});

	return { ws, readyData, user: finalUser };
}

export async function getIdentifiedWebSocket(user?: TestUser) {
	let finalUser = user;
	if (!finalUser) {
		finalUser = (await createTestUsers(1))[0];
	}

	const ws = await getWebSocket();

	const identifyData: GatewayIdentify = {
		op: GatewayOperations.IDENTIFY,
		d: {
			token: finalUser.accessToken,
			intents: 0,
			properties: { os: "test", browser: "test", device: "test" },
		},
	};

	await new Promise((resolve, reject) => {
		ws.onmessage = (event) => {
			if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
				wsSend(ws, identifyData);
				resolve(true);
			}
		};

		ws.onclose = ({ code, reason }) => {
			console.log(reason);
			reject(code);
		};
	});

	return ws;
}

export function testIsOpcode<O extends keyof GatewayOperationTypes>(data: unknown, opcode: O): data is GatewayOperationTypes[O] {
	let parsedData = data;
	if (typeof data === "string") {
		parsedData = JSON.parse(data);
	}

	if (isOpcode(parsedData, opcode)) {
		return true;
	}

	return false;
}

export function testIsDispatch<Event extends keyof GatewayEvents>(data: unknown, eventType: Event): data is GatewayPayload<Event> {
	if (testIsOpcode(data, GatewayOperations.DISPATCH)) {
		let parsedData = data as GatewayPayload<Event>;
		if (typeof data === "string") {
			parsedData = JSON.parse(data as unknown as string);
		}

		if (parsedData.t === eventType) {
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
		const url = envs.CDN_LOCAL_URL;
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

			return { ...x, accessToken, refreshToken } as TestUser;
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
			timestamp: new Date(),
			pinned: false,
			flags: 0,
		});
	}

	const createdMessages = await prisma.message.createManyAndReturn({
		data: messages,
	});

	const t1 = performance.now();
	timeSpent.createMessages += t1 - t0;

	return createdMessages;
}

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

export function disconnectWebSockets() {
	for (const ws of connectedWebsockets) {
		ws.close();
	}
}

export function containsId(recipients: APIChannelUser[], id: Snowflake | undefined) {
	return recipients.some((x) => x.id === id);
}

let timesDoneCalled = 0;
export function multiDone(done: (err?: unknown) => void, amount: number) {
	function tryDone() {
		timesDoneCalled++;

		if (timesDoneCalled === amount) {
			done();
			timesDoneCalled = 0;
		}
	}

	return tryDone;
}
