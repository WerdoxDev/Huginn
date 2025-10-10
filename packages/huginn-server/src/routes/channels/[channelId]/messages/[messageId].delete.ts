import { dispatchToTopic } from "#utils/gateway-utils";
import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import Elysia from "elysia";

export const deleteMessage = new Elysia()
   .use(verifyJwt2())
   .delete("/api/channels/:channelId/messages/:messageId", async ({ params: { channelId, messageId }, tokenPayload, status }) => {
      // Check permission
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });
      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return elysia.missingAccess(status);
      }

      const messageToCheck = await prisma.message.getById(channelId, messageId, { select: { author: { select: { id: true } } } });
      if (messageToCheck.author.id !== tokenPayload.id) {
         return elysia.missingPermission(status);
      }

      const deletedMessage = await prisma.message.deleteById(messageId, channelId, { select: { id: true, channelId: true } });
      dispatchToTopic(channelId, "message_delete", { id: deletedMessage.id, channelId: deletedMessage.channelId });

      return status("No Content");
   });
