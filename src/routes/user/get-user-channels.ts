import { prisma } from "@/src/database";
import { excludeSelfChannelUser, includeChannelRecipients } from "@/src/database/database-common";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserChannelsResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { idFix, merge } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/channels", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const channels: APIGetUserChannelsResult = idFix(
         await prisma.channel.getUserChannels(payload.id, false, merge(includeChannelRecipients, excludeSelfChannelUser(payload.id)))
      );

      return c.json(channels, HttpCode.OK);
   })
);

export default app;
