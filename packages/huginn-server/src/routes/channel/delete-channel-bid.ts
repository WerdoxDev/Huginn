import { prisma } from "@/db";
import { includeChannelRecipients } from "@/db/common";
import { dispatchToTopic } from "@/gateway/gateway-utils";
import { getJwt, handleRequest, verifyJwt } from "@/route-utils";
import { createError, notFound } from "@huginn/backend-shared";
import { APIDeleteDMChannelResult, Error, GatewayDMChannelDeleteDispatch, HttpCode, idFix } from "@huginn/shared";
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
