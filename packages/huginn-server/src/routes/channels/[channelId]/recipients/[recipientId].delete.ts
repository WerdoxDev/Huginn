import { missingAccess, missingPermission, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { ChannelType, Errors, MessageFlags, MessageType } from "@huginnjs/shared";
import { Elysia } from "elysia";

import { gateway } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchMessage } from "#utils/helpers";

export const deleteChannelRecipient = new Elysia()
   .use(verifyJwt())
   .delete("/api/channels/:channelId/recipients/:recipientId", async ({ params: { channelId, recipientId }, status, tokenPayload }) => {
      await prisma.user.assertUsersExist("/channels/:channelId/recipients/:recipientId", [recipientId]);

      const channel = await prisma.channel.getById(channelId, {
         select: { ...selectChannelRecipients, type: true, ownerId: true },
      });
      if (!channel.recipients.find((x) => x.id === tokenPayload.id)) {
         return missingAccess(status);
      }

      if (channel.type !== ChannelType.GROUP_DM) {
         return singleError(Errors.invalidChannelType(), status, "Bad Request");
      }

      if (channel.ownerId !== tokenPayload.id) {
         return missingPermission(status);
      }

      if (!channel.recipients.find((x) => x.id === recipientId)) {
         return singleError(Errors.invalidRecipient(recipientId), status, "Not Found");
      }

      const updatedChannel = await prisma.channel.removeRecipient(channelId, recipientId);

      // Delete read state
      await prisma.readState.deleteState(recipientId, channelId);

      // Dispatch channel delete event
      dispatchToTopic(recipientId, "channel_delete", updatedChannel);
      gateway.unsubscribeSessionsFromTopic(recipientId, channelId);

      const removedRecipient = channel.recipients.find((x) => x.id === recipientId);
      if (removedRecipient) {
         dispatchToTopic(channelId, "channel_recipient_remove", {
            channelId: channelId,
            user: removedRecipient,
         });
      }

      await dispatchMessage({
         authorId: tokenPayload.id,
         channelId,
         type: MessageType.RECIPIENT_REMOVE,
         mentions: [recipientId],
         flags: MessageFlags.NONE,
      });

      return status("No Content");
   });
