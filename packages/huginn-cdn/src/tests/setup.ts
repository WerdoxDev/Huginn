import { prepareServer } from "@huginn/backend-shared";
import { beforeAll } from "bun:test";

beforeAll(async () => {
   await prepareServer("http://localhost:3002");
});
