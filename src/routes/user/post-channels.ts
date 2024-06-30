import { DBErrorType, prisma } from "@/src/db";
import { excludeSelfChannelUser, includeChannelRecipients } from "@/src/db/common";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, hValidator, handleRequest, invalidFormBody, verifyJwt } from "@/src/route-utils";
import { gateway } from "@/src/server";
import { APIPostDMChannelResult } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { GatewayDMChannelCreateDispatch, GatewayDispatchEvents } from "@shared/gateway-types";
import { idFix, merge } from "@shared/utils";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ recipients: z.array(z.string()) });

const app = new Hono();

app.post("/users/@me/channels", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = c.req.valid("json");
         const payload = getJwt(c);

         if (body.recipients.length === 0) {
            return invalidFormBody(c);
         }

         const channel: APIPostDMChannelResult = idFix(
            await prisma.channel.createDM(
               payload.id,
               body.recipients,
               merge(includeChannelRecipients, excludeSelfChannelUser(payload.id))
            )
         );

         for (const id of [payload.id, ...body.recipients]) {
            gateway.getSession(id)?.subscribe(channel.id);
         }

         dispatchToTopic<GatewayDMChannelCreateDispatch>(payload.id, GatewayDispatchEvents.DM_CHANNEL_CREATE, channel, 0);

         return c.json(channel, HttpCode.CREATED);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
