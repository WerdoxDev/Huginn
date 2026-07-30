import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIDeleteDMChannelResult, ChannelType, MessageFlags, MessageType, merge, omit } from "@huginnjs/shared";
import Elysia from "elysia";

import { gateway } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage, filterChannel } from "#utils/helpers";

export const deleteChannel = new Elysia().use(verifyJwt()).delete("/api/channels/:channelId", async ({ params: { channelId }, status, tokenPayload }) => {
   const channel = await prisma.channel.getById(channelId, {
      select: { ...selectChannelRecipients, type: true, ownerId: true },
   });

   if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
      return missingAccess(status);
   }

   // Delete or leave the DM
   const leftChannel = await prisma.channel.leaveDirect(channelId, tokenPayload.id, {
      select: merge(selectChannelDefaults, omitChannelRecipient(tokenPayload.id)),
   });
   const filteredChannel: APIDeleteDMChannelResult = filterChannel(leftChannel);
   // Delete read state
   await prisma.readState.deleteState(tokenPayload.id, leftChannel.id);

   // Dispatch channel delete event
   dispatchToTopic(tokenPayload.id, "channel_delete", omit(filteredChannel, ["recipients"]));

   // Dispatch channel recipient remove event
   const removedRecipient = channel.recipients.find((x) => x.id === tokenPayload.id);
   if (channel.type === ChannelType.GROUP_DM && removedRecipient) {
      // Don't send recipient remove to the user who initiated this removal
      gateway.unsubscribeSessionsFromTopic(tokenPayload.id, channelId);

      dispatchToTopic(channelId, "channel_recipient_remove", {
         channelId: channelId,
         user: removedRecipient,
      });
   }

   // Send a recipient remove message in group dm
   if (channel.type === ChannelType.GROUP_DM && leftChannel.recipients.length > 0) {
      await dispatchMessage({
         authorId: tokenPayload.id,
         channelId,
         type: MessageType.RECIPIENT_REMOVE,
         flags: MessageFlags.NONE,
      });
   }

   // If the channel is now empty, delete it
   if (leftChannel.recipients.length === 0 && channel.type === ChannelType.GROUP_DM) {
      const deletedChannel = await prisma.channel.deleteGroupDirect(channelId, { select: selectChannelDefaults });
      const filteredChannel = filterChannel(deletedChannel);
      return status("OK", filteredChannel);
   }

   // Transfer the old owner to a new one alphabetically
   if (channel.ownerId === tokenPayload.id) {
      const updatedChannel = await prisma.channel.editDirect(
         channelId,
         undefined,
         undefined,
         channel.recipients.filter((x) => x.id !== tokenPayload.id).toSorted((a, b) => (a.username > b.username ? 1 : -1))[0].id,
         { select: merge(selectChannelDefaults, omitChannelRecipient(tokenPayload.id)) },
      );

      // Send out updated owner id to everyone except our user
      const filteredChannel: APIDeleteDMChannelResult = filterChannel(updatedChannel);
      for (const recipient of updatedChannel.recipients) {
         dispatchChannel(filteredChannel, "channel_update", recipient.id);
      }

      return status("OK", filteredChannel);
   }

   return status("OK", filteredChannel);
});
