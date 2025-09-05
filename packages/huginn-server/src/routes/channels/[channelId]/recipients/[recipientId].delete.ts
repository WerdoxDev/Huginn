import { createRoute, missingAccess, missingPermission, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchMessage } from "#utils/helpers";

createRoute("DELETE", "/api/channels/:channelId/recipients/:recipientId", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");
   const { channelId, recipientId } = c.req.param();

   await prisma.user.assertUsersExist("/channels/:channelId/recipients/:recipientId", [recipientId]);

   const channel = await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } });
   if (!channel.recipients.find((x) => x.id === payload.id)) {
      return missingAccess(c);
   }

   if (channel.type !== ChannelType.GROUP_DM) {
      return singleError(c, Errors.invalidChannelType());
   }

   if (channel.ownerId !== payload.id) {
      return missingPermission(c);
   }

   if (!channel.recipients.find((x) => x.id === recipientId)) {
      return singleError(c, Errors.invalidRecipient(recipientId), HttpCode.NOT_FOUND);
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

   await dispatchMessage({ authorId: payload.id, channelId, type: MessageType.RECIPIENT_REMOVE, mentions: [recipientId], flags: MessageFlags.NONE });

   return c.newResponse(null, HttpCode.NO_CONTENT);
});
