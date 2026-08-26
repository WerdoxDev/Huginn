import { logger } from "@huginn/backend-shared/logger";
import { setFileTypeDetector } from "elysia";
import { fileTypeFromBlob } from "file-type";

import { app } from "#server";
import { env } from "#setup";

setFileTypeDetector(fileTypeFromBlob);

app.listen({ hostname: env.CDN_HOST, port: env.CDN_PORT, idleTimeout: 40 }, (server) => {
   logger.info({ listenHostname: server.hostname, port: server.port }, "cdn listening");
});
