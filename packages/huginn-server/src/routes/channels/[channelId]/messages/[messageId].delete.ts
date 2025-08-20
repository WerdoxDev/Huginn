import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";
import { createRoute, missingAccess, missingPermission } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { HttpCode } from "@huginn/shared";

createRoute("DELETE", "/api/channels/:channelId/messages/:messageId", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");
   const messageId = c.req.param("messageId");
   const channelId = c.req.param("channelId");

   // Check permission
   const channel = await prisma.channel.getById(channelId, { select: { id: true } });
   if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
      return missingAccess(c);
   }

   const messageToCheck = await prisma.message.getById(channelId, messageId, { select: { author: { select: { id: true } } } });
   if (messageToCheck.author.id !== payload.id) {
      return missingPermission(c);
   }

   const deletedMessage = await prisma.message.deleteById(messageId, channelId, { select: { id: true, channelId: true } });
   dispatchToTopic(channelId, "message_delete", { id: deletedMessage.id, channelId: deletedMessage.channelId });

   return c.newResponse(null, HttpCode.NO_CONTENT);
});
