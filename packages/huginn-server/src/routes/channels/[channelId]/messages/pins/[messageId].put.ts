import { dispatchToTopic } from "#utils/gateway-utils";
import { filterMessage } from "#utils/helpers";
import { missingAccess, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessagePin } from "@huginn/backend-shared/database/common";
import { type APIPutChannelPinResult } from "@huginn/shared";
import Elysia from "elysia";

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
            message: filterMessage(existingPin.message),
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
         message: filterMessage(createdPin.message),
      };

      dispatchToTopic(channelId, "message_update", result.message);

      return status("Created", result);
   });
