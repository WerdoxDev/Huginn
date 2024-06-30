import { DBErrorType, prisma } from "@/src/db";
import { includeChannelRecipients } from "@/src/db/common";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetChannelByIdResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { idFix } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const channel: APIGetChannelByIdResult = idFix(
            await prisma.channel.getById(c.req.param("channelId"), includeChannelRecipients)
         );

         return c.json(channel, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
