import { logger } from "@huginn/backend-shared/logger";

import { app } from "#server";
import { env } from "#setup";

app.listen({ hostname: env.CDN_HOST, port: env.CDN_PORT, idleTimeout: 40 }, (server) => {
   logger.info({ listenHostname: server.hostname, port: server.port }, "cdn listening");
});
