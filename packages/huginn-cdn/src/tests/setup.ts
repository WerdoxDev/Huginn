import { beforeAll } from "bun:test";
import { prepareServer } from "@huginn/backend-shared";

beforeAll(async () => {
	await prepareServer();
});
