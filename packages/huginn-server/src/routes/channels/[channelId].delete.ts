import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage, filterChannel } from "#utils/helpers";
import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIDeleteDMChannelResult, ChannelType, MessageFlags, MessageType, merge, omit } from "@huginn/shared";
import Elysia from "elysia";

export const deleteChannel = new Elysia()
   .use(verifyJwt())
   .delete("/api/channels/:channelId", async ({ params: { channelId }, status, tokenPayload }) => {
      const channel = await prisma.channel.getById(channelId, {
         select: { ...selectChannelRecipients, type: true, ownerId: true },
      });

      if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
         return missingAccess(status);
      }

      // Delete or leave the DM
      const deletedChannel = await prisma.channel.deleteDM(channelId, tokenPayload.id, {
         select: merge(selectChannelDefaults, omitChannelRecipient(tokenPayload.id)),
      });
      const filteredChannel: APIDeleteDMChannelResult = filterChannel(deletedChannel);
      // Delete read state
      await prisma.readState.deleteState(tokenPayload.id, deletedChannel.id);

      // Dispatch channel delete event
      dispatchToTopic(tokenPayload.id, "channel_delete", omit(filteredChannel, ["recipients"]));

      // Dispatch channel recipient remove event
      const removedRecipient = channel.recipients.find((x) => x.id === tokenPayload.id);
      if (channel.type === ChannelType.GROUP_DM && removedRecipient) {
         gateway.unsubscribeSessionsFromTopic(tokenPayload.id, channelId);
         dispatchToTopic(channelId, "channel_recipient_remove", {
            channelId: channelId,
            user: removedRecipient,
         });
      }

      // Send a recipient remove message in group dm
      if (channel.type === ChannelType.GROUP_DM) {
         await dispatchMessage({
            authorId: tokenPayload.id,
            channelId,
            type: MessageType.RECIPIENT_REMOVE,
            flags: MessageFlags.NONE,
         });
      }

      // Transfer the old owner to a new one alphabetically
      if (channel.ownerId === tokenPayload.id) {
         const updatedChannel = await prisma.channel.editDM(
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
