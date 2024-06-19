import { DBErrorType, prisma } from "@/src/database";
import { includeChannelRecipients } from "@/src/database/database-common";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { gateway } from "@/src/server";
import { APIDeleteRemoveDMResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { GatewayDMChannelDeleteDispatch, GatewayDispatchEvents } from "@shared/gateway-types";
import { idFix } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.delete("/channels/:channelId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const payload = getJwt(c);

         const channel: APIDeleteRemoveDMResult = idFix(
            await prisma.channel.removeDM(c.req.param("channelId"), payload.id, includeChannelRecipients)
         );

         dispatchToTopic<GatewayDMChannelDeleteDispatch>(payload.id, GatewayDispatchEvents.DM_CHANNEL_DELETE, channel, 0);
         gateway.getSession(payload.id)?.unsubscribe(channel.id);

         return c.json(channel, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.unknownUser()), HttpCode.NOT_FOUND);
         }
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
