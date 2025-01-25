import { afterAll, afterEach, beforeAll } from "bun:test";
import { startServer } from "@huginn/backend-shared";
import { disconnectWebSockets, removeChannels, removeUsers } from "./utils";

beforeAll(async () => {
	await startServer();
});

afterEach(() => {
	disconnectWebSockets();
});

afterAll(async () => {
	console.log("START CLEANUP");
	try {
		await removeChannels();
		await removeUsers();
	} catch (e) {
		console.error(e);
	}
	console.log("END CLEANUP");
	// console.log(timeSpent);
});
