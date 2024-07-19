import { prisma } from "@/src/db";
import { excludeSelfChannelUser, includeChannelRecipients } from "@/src/db/common";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserChannelsResult } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { idFix, merge } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/channels", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const channels: APIGetUserChannelsResult = idFix(
         await prisma.channel.getUserChannels(payload.id, false, merge(includeChannelRecipients, excludeSelfChannelUser(payload.id))),
      );

      return c.json(channels, HttpCode.OK);
   }),
);

export default app;
