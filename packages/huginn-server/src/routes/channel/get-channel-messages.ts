import { prisma } from "@/src/db";
import { includeMessageAuthor, includeMessageMentions } from "@/src/db/common";
import { hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetChannelMessagesResult } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { idFix, merge, omitArray } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });

const app = new Hono();

app.get("/channels/:channelId/messages", verifyJwt(), hValidator("query", schema), c =>
   handleRequest(c, async () => {
      const query = c.req.valid("query");
      const limit = Number(query.limit) || 50;
      const before = query.before;
      const after = query.after;
      const channelId = c.req.param("channelId");

      const messages: APIGetChannelMessagesResult = omitArray(
         idFix(await prisma.message.getMessages(channelId, limit, before, after, merge(includeMessageAuthor, includeMessageMentions))),
         ["authorId"],
      );

      return c.json(messages, HttpCode.OK);
   }),
);

export default app;
