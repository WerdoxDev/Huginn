import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";

export const postAckMessage = new Elysia()
   .use(verifyJwt())
   .post("/api/channels/:channelId/messages/:messageId/ack", async ({ params: { channelId, messageId }, status, tokenPayload }) => {
      await prisma.readState.updateLastRead(tokenPayload.id, channelId, messageId);
      dispatchToTopic(tokenPayload.id, "message_ack", { channelId, messageId });

      return status("No Content");
   });
