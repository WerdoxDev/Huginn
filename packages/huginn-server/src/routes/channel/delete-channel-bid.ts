import { prisma } from "@/src/db";
import { includeChannelRecipients } from "@/src/db/common";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { getJwt, handleRequest, notFound, verifyJwt } from "@/src/route-utils";
import { APIDeleteDMChannelResult } from "@huginn/shared";
import { Error, HttpCode } from "@huginn/shared";
import { GatewayDMChannelDeleteDispatch } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.delete("/channels/:channelId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const channelId = c.req.param("channelId");

      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return notFound(c, createError(Error.unknownChannel(channelId)));
      }

      const channel: APIDeleteDMChannelResult = idFix(await prisma.channel.deleteDM(channelId, payload.id, includeChannelRecipients));

      dispatchToTopic<GatewayDMChannelDeleteDispatch>(payload.id, "channel_delete", channel, 0);
      // gateway.getSession(payload.id)?.unsubscribe(channel.id);

      return c.json(channel, HttpCode.OK);
   }),
);

export default app;
