import { createRoute, missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIGetMessageByIdResult, HttpCode } from "@huginn/shared";
import { filterMessage } from "#utils/helpers";

createRoute("GET", "/api/channels/:channelId/messages/:messageId", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");
   const { channelId, messageId } = c.req.param();

   if (!(await prisma.user.hasChannel(payload.id, channelId))) {
      return missingAccess(c);
   }

   const dbMessage = await prisma.message.getById(channelId, messageId, { select: selectAllMessage });
   const message: APIGetMessageByIdResult = filterMessage(dbMessage);

   return c.json(message, HttpCode.OK);
});
