import { createRoute, missingAccess, validator, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessageCall, selectMessageDefaults } from "@huginn/backend-shared/database/common";
import { HttpCode, type APIGetChannelMessagesResult } from "@huginn/shared";
import { z } from "zod";
import { filterMessage } from "#utils/helpers";
("@huginn/backend-shared/database/common");

const querySchema = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });

createRoute("GET", "/api/channels/:channelId/messages", verifyJwt(), validator("query", querySchema), async (c) => {
   const payload = c.get("tokenPayload");
   const query = c.req.valid("query");
   const { channelId } = c.req.param();
   const limit = Number(query.limit) || 50;
   const before = query.before;
   const after = query.after;

   const channel = await prisma.channel.getById(channelId, { select: { id: true } });

   if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
      return missingAccess(c);
   }

   const dbMessages = await prisma.message.getMessages(channelId, limit, before, after, {
      select: { ...selectMessageDefaults, ...selectMessageCall },
   });

   const messages: APIGetChannelMessagesResult = dbMessages.map((x) => filterMessage(x));

   return c.json(messages, HttpCode.OK);
});
