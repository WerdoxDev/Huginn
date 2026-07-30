import { missingAccess, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessagePin } from "@huginn/backend-shared/database/common";
import { MessageFlags, MessageType, type APIPutChannelPinResult } from "@huginnjs/shared";
import Elysia from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchMessage, filterMessage } from "#utils/helpers";

export const putChannelMessagePin = new Elysia()
   .use(verifyJwt())
   .put("/api/channels/:channelId/messages/pins/:messageId", async ({ params: { channelId, messageId }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });

      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return missingAccess(status);
      }

      await prisma.message.getById(channelId, messageId, { select: { id: true } });

      const [, existingPin] = await tryCatch(() =>
         prisma.messagePin.getByMessageId(messageId, {
            select: selectMessagePin,
         }),
      );

      if (existingPin) {
         const result: APIPutChannelPinResult = {
            pinnedAt: existingPin.pinnedAt,
            message: await filterMessage(existingPin.message, { receiverId: tokenPayload.id }),
         };

         return status("Created", result);
      }

      const createdPin = await prisma.messagePin.createPin(
         {
            channelId,
            messageId,
            pinnedById: tokenPayload.id,
         },
         { select: selectMessagePin },
      );

      const result: APIPutChannelPinResult = {
         pinnedAt: createdPin.pinnedAt,
         message: await filterMessage(createdPin.message, { receiverId: tokenPayload.id }),
      };

      dispatchToTopic(channelId, "message_update", result.message);
      await dispatchMessage({
         authorId: tokenPayload.id,
         channelId,
         type: MessageType.CHANNEL_PINNED_MESSAGE,
         messageReferenceId: messageId,
         flags: MessageFlags.NONE,
      });

      return status("Created", result);
   });
