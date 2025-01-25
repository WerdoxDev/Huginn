import { beforeAll } from "bun:test";
import { startServer } from "@huginn/backend-shared";

beforeAll(async () => {
	await startServer();
});
