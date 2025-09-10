import { createRoute, missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIDeleteDMChannelResult, ChannelType, HttpCode, MessageFlags, MessageType, merge, omit } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage, filterChannel } from "#utils/helpers";

createRoute("DELETE", "/api/channels/:channelId", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");
   const { channelId } = c.req.param();

   const channel = await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } });

   if (!(await prisma.user.hasChannel(payload.id, channelId))) {
      return missingAccess(c);
   }

   // Delete or leave the DM
   const deletedChannel = await prisma.channel.deleteDM(channelId, payload.id, {
      select: merge(selectChannelDefaults, omitChannelRecipient(payload.id)),
   });
   const filteredChannel: APIDeleteDMChannelResult = filterChannel(deletedChannel);
   // Delete read state
   await prisma.readState.deleteState(payload.id, deletedChannel.id);

   // Dispatch channel delete event
   dispatchToTopic(payload.id, "channel_delete", omit(filteredChannel, ["recipients"]));

   // Dispatch channel recipient remove event
   const removedRecipient = channel.recipients.find((x) => x.id === payload.id);
   if (channel.type === ChannelType.GROUP_DM && removedRecipient) {
      gateway.unsubscribeSessionsFromTopic(payload.id, channelId);
      dispatchToTopic(channelId, "channel_recipient_remove", { channelId: channelId, user: removedRecipient });
   }

   // Send a recipient remove message in group dm
   if (channel.type === ChannelType.GROUP_DM) {
      await dispatchMessage({ authorId: payload.id, channelId, type: MessageType.RECIPIENT_REMOVE, flags: MessageFlags.NONE });
   }

   // Transfer the old owner to a new one alphabetically
   if (channel.ownerId === payload.id) {
      const updatedChannel = await prisma.channel.editDM(
         channelId,
         undefined,
         undefined,
         channel.recipients.filter((x) => x.id !== payload.id).toSorted((a, b) => (a.username > b.username ? 1 : -1))[0].id,
         { select: merge(selectChannelDefaults, omitChannelRecipient(payload.id)) },
      );

      // Send out updated owner id to everyone except our user
      const filteredChannel: APIDeleteDMChannelResult = filterChannel(updatedChannel);
      for (const recipient of updatedChannel.recipients) {
         dispatchChannel(filteredChannel, "channel_update", recipient.id);
      }

      return c.json(filteredChannel, HttpCode.OK);
   }

   return c.json(filteredChannel, HttpCode.OK);
});
