import { afterAll } from "bun:test";
import { removeChannels, removeUsers, timeSpent } from "./utils";

afterAll(async () => {
	await removeChannels();
	await removeUsers();
	// console.log(timeSpent);
});
