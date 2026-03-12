import { filterMessage } from "#utils/helpers";
import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIGetMessageByIdResult } from "@huginn/shared";
import Elysia from "elysia";

export const getMessage = new Elysia()
   .use(verifyJwt())
   .get("/api/channels/:channelId/messages/:messageId", async ({ tokenPayload, params: { channelId, messageId }, status }) => {
      if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
         return missingAccess(status);
      }

      const dbMessage = await prisma.message.getById(channelId, messageId, {
         select: selectAllMessage,
      });
      const message: APIGetMessageByIdResult = filterMessage(dbMessage);

      return status("OK", message);
   });
