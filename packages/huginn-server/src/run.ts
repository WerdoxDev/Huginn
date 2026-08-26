import { logger } from "@huginn/backend-shared/logger";
import { setFileTypeDetector } from "elysia";
import { fileTypeFromBlob } from "file-type";

import { startCronJobs } from "#cron-jobs";
import { ws } from "#routes/gateway";
import { app } from "#server";
import { env } from "#setup";

await startCronJobs();

setFileTypeDetector(fileTypeFromBlob);

app.listen(
   {
      websocket: ws.websocket,
      hostname: env.SERVER_HOST,
      port: env.SERVER_PORT,
      idleTimeout: 40,
   },
   (server) => {
      if (process.env.TEST) {
      } else {
         logger.info({ listenHostname: server.hostname, port: server.port }, "server listening");
      }
   },
);
