import { prisma } from "@/db";
import { includeChannelRecipients } from "@/db/common";
import { getJwt, handleRequest, verifyJwt } from "@/route-utils";
import { createError, notFound } from "@huginn/backend-shared";
import { APIGetChannelByIdResult, Error, HttpCode, idFix } from "@huginn/shared";
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
   }),
);

export default app;
