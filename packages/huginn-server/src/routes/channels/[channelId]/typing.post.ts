import { verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient } from "@huginn/backend-shared/database/common";
import { merge } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import { Elysia } from "elysia";

export const postTyping = new Elysia()
   .use(verifyJwt2())
   .post("/api/channels/:channelId/typing", async ({ params: { channelId }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, {
         select: merge({ recipients: { select: { id: true } } }, omitChannelRecipient(tokenPayload.id)),
      });

      for (const recipient of channel.recipients) {
         dispatchToTopic(recipient.id, "typing_start", { channelId, userId: tokenPayload.id, timestamp: Date.now() });
      }

      return status("No Content");
   });
