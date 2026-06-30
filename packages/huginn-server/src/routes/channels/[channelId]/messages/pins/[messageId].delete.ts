import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessagePin } from "@huginn/backend-shared/database/common";
import Elysia from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { filterMessage } from "#utils/helpers";

export const deleteChannelMessagePin = new Elysia()
   .use(verifyJwt())
   .delete("/api/channels/:channelId/messages/pins/:messageId", async ({ params: { channelId, messageId }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });

      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return missingAccess(status);
      }

      const deletedPin = await prisma.messagePin.deletePin(channelId, messageId, {
         select: selectMessagePin,
      });

      dispatchToTopic(channelId, "message_update", await filterMessage(deletedPin.message, { receiverId: tokenPayload.id }));

      return status("No Content");
   });
