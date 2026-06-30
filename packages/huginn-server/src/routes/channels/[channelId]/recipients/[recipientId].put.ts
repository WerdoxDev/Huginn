import { missingAccess, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { ChannelType, Errors, MessageFlags, MessageType } from "@huginn/shared";
import { Elysia } from "elysia";

import { gateway } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage } from "#utils/helpers";

export const putChannelRecipient = new Elysia()
   .use(verifyJwt())
   .put("/api/channels/:channelId/recipients/:recipientId", async ({ params: { channelId, recipientId }, status, tokenPayload }) => {
      const channel = await prisma.channel.getById(channelId, {
         select: { type: true, recipients: { select: { id: true } } },
      });
      if (channel.type !== ChannelType.GROUP_DM) {
         return singleError(Errors.invalidChannelType(), status, "Bad Request");
      }

      if (!channel.recipients.find((x) => x.id === tokenPayload.id)) {
         return missingAccess(status);
      }

      if (channel.recipients.find((x) => x.id === recipientId)) {
         return status("No Content");
      }

      const updatedChannel = await prisma.channel.addRecipient(channelId, recipientId, {
         select: selectChannelDefaults,
      });

      // Create read state
      await prisma.readState.createState(recipientId, channelId);

      // Dispatch recipient add event
      const addedRecipient = updatedChannel.recipients.find((x) => x.id === recipientId);
      if (addedRecipient) {
         dispatchToTopic(channelId, "channel_recipient_add", {
            channelId: channelId,
            user: addedRecipient,
         });
      }

      // Dispatch channel create event
      gateway.subscribeSessionsToTopic(recipientId, channelId);
      dispatchChannel(updatedChannel, "channel_create", recipientId);

      await dispatchMessage({
         authorId: tokenPayload.id,
         channelId,
         type: MessageType.RECIPIENT_ADD,
         mentions: [recipientId],
         flags: MessageFlags.NONE,
      });

      gateway.voiceManager.sendCallStateToUser(channelId, recipientId);

      return status("No Content");
   });
