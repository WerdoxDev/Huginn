import { prisma } from "@/db";
import { includeMessageAuthor, includeMessageMentions } from "@/db/common";
import { getJwt, handleRequest, unauthorized, verifyJwt } from "@/route-utils";
import { APIGetMessageByIdResult } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { idFix, merge, omit } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId/messages/:messageId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const channelId = c.req.param("channelId");
      const messageId = c.req.param("messageId");

      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return unauthorized(c);
      }

      const message: APIGetMessageByIdResult = omit(
         idFix(await prisma.message.getById(channelId, messageId, merge(includeMessageAuthor, includeMessageMentions))),
         ["authorId"],
      );

      return c.json(message, HttpCode.OK);
   }),
);

export default app;
