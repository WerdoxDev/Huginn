import { afterAll, afterEach, beforeAll, setDefaultTimeout } from "bun:test";
import { disconnectWebSockets, getServer, removeChannels, removeUsers } from "./utils";

setDefaultTimeout(20000);

beforeAll(async () => {
	await getServer();
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
