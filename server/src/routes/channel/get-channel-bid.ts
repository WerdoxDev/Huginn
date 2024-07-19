import { prisma } from "@/src/db";
import { includeChannelRecipients } from "@/src/db/common";
import { createError } from "@/src/factory/error-factory";
import { getJwt, handleRequest, notFound, verifyJwt } from "@/src/route-utils";
import { APIGetChannelByIdResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { idFix } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const channelId = c.req.param("channelId");

      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return notFound(c, createError(Error.unknownChannel(channelId)));
      }

      const channel: APIGetChannelByIdResult = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));

      return c.json(channel, HttpCode.OK);
   })
);

export default app;
