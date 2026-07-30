import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIGetChannelMessagesResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { filterMessage } from "#utils/helpers";

export const getChannelMessages = new Elysia().use(verifyJwt()).get(
   "/api/channels/:channelId/messages",
   async ({ query: { after, before, limit, around }, params: { channelId }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });
      limit = limit ?? 50;

      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return missingAccess(status);
      }

      const dbMessages = await prisma.message.getMessages(channelId, limit, before, after, around, {
         select: selectAllMessage,
      });

      const messages: APIGetChannelMessagesResult = await Promise.all(dbMessages.map((x) => filterMessage(x, { receiverId: tokenPayload.id })));

      return status("OK", messages);
   },
   {
      query: t.Object({
         limit: t.Optional(t.Number()),
         before: t.Optional(t.String()),
         after: t.Optional(t.String()),
         around: t.Optional(t.String()),
      }),
   },
);
