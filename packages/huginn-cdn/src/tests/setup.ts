import { beforeAll } from "bun:test";
import { prepareServer } from "@huginn/backend-shared";

beforeAll(async () => {
	process.env.test = JSON.stringify(true);
	await prepareServer();
});
