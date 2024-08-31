import { includeMessageAuthor, includeMessageMentions } from "@/database/common";
import { router } from "@/server";
import { prisma } from "@database";
import { useValidatedQuery, useValidatedParams } from "@huginn/backend-shared";
import { APIGetChannelMessagesResult, omitArray, idFix, merge, HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const querySchema = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });
const paramsSchema = z.object({ channelId: z.string() });

router.get(
   "/channels/:channelId/messages",
   defineEventHandler(async event => {
      const query = await useValidatedQuery(event, querySchema);
      const channelId = (await useValidatedParams(event, paramsSchema)).channelId;
      const limit = Number(query.limit) || 50;
      const before = query.before;
      const after = query.after;

      const messages: APIGetChannelMessagesResult = omitArray(
         idFix(await prisma.message.getMessages(channelId, limit, before, after, merge(includeMessageAuthor, includeMessageMentions))),
         ["authorId"],
      );

      setResponseStatus(event, HttpCode.OK);
      return messages;
   }),
);
