import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIGetChannelMessagesResult } from "@huginn/shared";
import { filterMessage } from "#utils/helpers";
import Elysia, { t } from "elysia";

export const getChannelMessages = new Elysia().use(verifyJwt2()).get(
   "/api/channels/:channelId/messages",
   async ({ query: { after, before, limit }, params: { channelId }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });
      limit = limit ?? 50;

      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return elysia.missingAccess(status);
      }

      const dbMessages = await prisma.message.getMessages(channelId, limit, before, after, {
         select: selectAllMessage,
      });

      const messages: APIGetChannelMessagesResult = dbMessages.map((x) => filterMessage(x));

      return status("OK", messages);
   },
   { query: t.Object({ limit: t.Optional(t.Number()), before: t.Optional(t.String()), after: t.Optional(t.String()) }) },
);
