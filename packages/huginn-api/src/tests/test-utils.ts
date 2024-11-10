import type { LoginCredentials } from "@huginn/shared";
import { HuginnClient } from "../..";

export const url = "localhost:3001";

export const testCredentials: LoginCredentials = {
	username: "test",
	email: "test@gmail.com",
	password: "test",
};

export const test2Credentials: LoginCredentials = {
	username: "test2",
	email: "test2@gmail.com",
	password: "test2",
};

export const test3Credentials: LoginCredentials = {
	username: "test3",
	email: "test3@gmail.com",
	password: "test3",
};

export const test4Credentials: LoginCredentials = {
	username: "test4",
	email: "test4@gmail.com",
	password: "test4",
};

export const editCredentials: LoginCredentials = {
	username: "test-edited",
	email: "test.edited@gmail.com",
	password: "test-edited",
};

export async function getLoggedClient(
	credentials: LoginCredentials = testCredentials,
	// skipWaitForReady?: boolean,
): Promise<HuginnClient> {
	const client = new HuginnClient({
		rest: { api: `http://${url}/api` },
		gateway: { url: `ws://${url}/gateway`, createSocket: (url) => new WebSocket(url), log: false },
	});

	const result = await client.login(credentials);

	client.user = result;
	// if (!skipWaitForReady) {
	// 	await client.gateway.connectAndWaitForReady();
	// }

	return client;
}

export function getNewClient(): HuginnClient {
	const client = new HuginnClient({
		rest: { api: `http://${url}/api` },
		gateway: { url: `ws://${url}/gateway`, createSocket: (url) => new WebSocket(url), log: false },
	});
	return client;
}
