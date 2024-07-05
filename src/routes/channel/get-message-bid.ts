import { prisma } from "@/src/db";
import { includeMessageAuthor, includeMessageMentions } from "@/src/db/common";
import { getJwt, handleRequest, unauthorized, verifyJwt } from "@/src/route-utils";
import { APIGetMessageByIdResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { idFix, merge, omit } from "@shared/utils";
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
         ["authorId"]
      );

      return c.json(message, HttpCode.OK);
   })
);

export default app;
