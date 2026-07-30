import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient } from "@huginn/backend-shared/database/common";
import { merge } from "@huginnjs/shared";
import { Elysia } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";

export const postTyping = new Elysia().use(verifyJwt()).post("/api/channels/:channelId/typing", async ({ params: { channelId }, tokenPayload, status }) => {
   const channel = await prisma.channel.getById(channelId, {
      select: merge({ recipients: { select: { id: true } } }, omitChannelRecipient(tokenPayload.id)),
   });

   for (const recipient of channel.recipients) {
      dispatchToTopic(recipient.id, "typing_start", {
         channelId,
         userId: tokenPayload.id,
         timestamp: Date.now(),
      });
   }

   return status("No Content");
});
