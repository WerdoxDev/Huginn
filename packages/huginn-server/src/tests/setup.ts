import { afterAll, afterEach } from "bun:test";
import { disconnectWebSockets, removeChannels, removeUsers, timeSpent } from "./utils";

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
