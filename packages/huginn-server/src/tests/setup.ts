process.env.LOG_LEVEL = "error";

import { prepareServer } from "@huginn/backend-shared";
import { afterAll, afterEach, beforeAll } from "bun:test";

import { ws } from "#routes/gateway";
import { app } from "#server";
import { env } from "#setup";

import { disconnectWebSockets, removeChannels, removeUsers, timeSpent } from "./utils";

beforeAll(async (done) => {
   app.listen({ websocket: ws.websocket, hostname: env.SERVER_HOST, port: env.SERVER_PORT, idleTimeout: 40 }, async (server) => {
      await prepareServer(server.url.toString());
      done();
   });
});

afterEach(() => {
   disconnectWebSockets();
});

afterAll(async () => {
   try {
      await removeChannels();
      await removeUsers();
   } catch (e) {
      console.error(e);
   }
   console.log(timeSpent);
});
