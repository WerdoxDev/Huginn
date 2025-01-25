import { afterAll, afterEach, beforeAll, setDefaultTimeout } from "bun:test";
import { disconnectWebSockets, removeChannels, removeUsers, startServer, testHandler } from "./utils";

// setDefaultTimeout(10000);

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
