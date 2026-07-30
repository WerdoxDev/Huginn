import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIGetMessageByIdResult } from "@huginnjs/shared";
import Elysia from "elysia";

import { filterMessage } from "#utils/helpers";

export const getMessage = new Elysia()
   .use(verifyJwt())
   .get("/api/channels/:channelId/messages/:messageId", async ({ tokenPayload, params: { channelId, messageId }, status }) => {
      if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
         return missingAccess(status);
      }

      const dbMessage = await prisma.message.getById(channelId, messageId, {
         select: selectAllMessage,
      });
      const message: APIGetMessageByIdResult = await filterMessage(dbMessage);

      return status("OK", message);
   });
