import { prepareServer } from "@huginn/backend-shared";
import { beforeAll } from "bun:test";

import { app } from "#server";
import { env } from "#setup";

beforeAll(async () => {
   app.listen({ hostname: env.CDN_HOST, port: env.CDN_PORT, idleTimeout: 40 }, async (server) => {
      await prepareServer(server.url.toString());
   });
});
