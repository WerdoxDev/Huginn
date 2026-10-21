import { invalidBody, missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { ChannelType, idFix, type APIPostChannelSearchResult } from "@huginnjs/shared";
import Elysia from "elysia";

import { filterMessage } from "#utils/helpers";
import { areMessageSearchIdsValid, buildMessageSearchWhere, messageSearchSchema } from "#utils/message-search";

export const postChannelSearch = new Elysia().use(verifyJwt()).post(
   "/api/channels/@me/search",
   async ({ body, tokenPayload, status }) => {
      if (!areMessageSearchIdsValid(body)) return invalidBody(status);

      if (body.channelId !== undefined) {
         const channel = await prisma.channel.getById(body.channelId, { select: { id: true, type: true } });
         if ((channel.type !== ChannelType.DM && channel.type !== ChannelType.GROUP_DM) || !(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
            return missingAccess(status);
         }
      }

      const dbMessages = await prisma.message.findMany({
         where: buildMessageSearchWhere(tokenPayload.id, body),
         select: selectAllMessage,
         orderBy: { id: body.sortOrder ?? "desc" },
         take: body.limit ?? 25,
         skip: body.offset ?? 0,
      });

      const messages: APIPostChannelSearchResult = await Promise.all(
         idFix(dbMessages).map((message) => filterMessage(message, { receiverId: tokenPayload.id })),
      );
      return status("OK", messages);
   },
   { body: messageSearchSchema },
);
