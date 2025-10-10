import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { ChannelType, Errors, MessageFlags, MessageType } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchMessage } from "#utils/helpers";
import { Elysia } from "elysia";

export const deleteChannelRecipient = new Elysia()
   .use(verifyJwt2())
   .delete("/api/channels/:channelId/recipients/:recipientId", async ({ params: { channelId, recipientId }, status, tokenPayload }) => {
      await prisma.user.assertUsersExist("/channels/:channelId/recipients/:recipientId", [recipientId]);

      const channel = await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } });
      if (!channel.recipients.find((x) => x.id === tokenPayload.id)) {
         return elysia.missingAccess(status);
      }

      if (channel.type !== ChannelType.GROUP_DM) {
         return elysia.singleError(Errors.invalidChannelType(), status, "Bad Request");
      }

      if (channel.ownerId !== tokenPayload.id) {
         return elysia.missingPermission(status);
      }

      if (!channel.recipients.find((x) => x.id === recipientId)) {
         return elysia.singleError(Errors.invalidRecipient(recipientId), status, "Not Found");
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
