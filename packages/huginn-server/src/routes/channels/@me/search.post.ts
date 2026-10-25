import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { ChannelType, idFix, type APIPostChannelSearchResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { filterMessage } from "#utils/helpers";
import { assertMessageSearchIdsValid, buildMessageSearchWhere } from "#utils/message-search";

const schema = t.Object({
   content: t.Optional(t.String()),
   channelId: t.Optional(t.String()),
   authorId: t.Optional(t.String()),
   mentions: t.Optional(t.Array(t.String())),
   has: t.Optional(t.Array(t.Union([t.Literal("image"), t.Literal("video"), t.Literal("audio"), t.Literal("file"), t.Literal("link"), t.Literal("embed")]))),
   sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
   limit: t.Optional(t.Integer({ minimum: 1, maximum: 25 })),
   offset: t.Optional(t.Integer({ minimum: 0, maximum: 2_147_483_647 })),
   pinned: t.Optional(t.Boolean()),
   attachmentFilename: t.Optional(t.String({ minLength: 1 })),
   attachmentExtension: t.Optional(t.String({ pattern: "^\\.?[a-zA-Z0-9]+(?:\\.[a-zA-Z0-9]+)*$" })),
   embedType: t.Optional(t.String({ minLength: 1 })),
   minId: t.Optional(t.String()),
   maxId: t.Optional(t.String()),
   repliedToUserId: t.Optional(t.String()),
   repliedToMessageId: t.Optional(t.String()),
   types: t.Optional(t.Array(t.Number())),
});

export const postChannelSearch = new Elysia().use(verifyJwt()).post(
   "/api/channels/@me/search",
   async ({ body, tokenPayload, status }) => {
      assertMessageSearchIdsValid(body);

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
   { body: schema },
);
