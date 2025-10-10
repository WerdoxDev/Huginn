import { verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { dispatchToTopic } from "#utils/gateway-utils";
import Elysia from "elysia";

export const postAckMessage = new Elysia()
   .use(verifyJwt2())
   .post("/api/channels/:channelId/messages/:messageId/ack", async ({ params: { channelId, messageId }, status, tokenPayload }) => {
      await prisma.readState.updateLastRead(tokenPayload.id, channelId, messageId);
      dispatchToTopic(tokenPayload.id, "message_ack", { channelId, messageId });

      return status("No Content");
   });
