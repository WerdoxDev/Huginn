import { prisma } from "@/db";
import { excludeSelfChannelUser, includeChannelRecipients } from "@/db/common";
import { dispatchToTopic } from "@/gateway/gateway-utils";
import { getJwt, hValidator, handleRequest, invalidFormBody, verifyJwt } from "@/route-utils";
import { gateway } from "@/server";
import { APIPostDMChannelResult } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { GatewayDMChannelCreateDispatch } from "@huginn/shared";
import { idFix, merge } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ recipients: z.array(z.string()) });

const app = new Hono();

app.post("/users/@me/channels", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(c, async () => {
      const body = c.req.valid("json");
      const payload = getJwt(c);

      if (body.recipients.length === 0) {
         return invalidFormBody(c);
      }

      const channel: APIPostDMChannelResult = idFix(
         await prisma.channel.createDM(
            payload.id,
            body.recipients,
            merge(includeChannelRecipients, excludeSelfChannelUser(payload.id)),
         ),
      );

      for (const id of [payload.id, ...body.recipients]) {
         gateway.getSession(id)?.subscribe(channel.id);
      }

      dispatchToTopic<GatewayDMChannelCreateDispatch>(payload.id, "channel_create", channel, 0);

      return c.json(channel, HttpCode.CREATED);
   }),
);

export default app;
