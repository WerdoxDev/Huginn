import { DBErrorType, prisma } from "@/src/database";
import { includeChannelRecipients } from "@/src/database/database-common";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetChannelByIdResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { omit } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const channel: APIGetChannelByIdResult = omit(
            await prisma.channel.getById(c.req.param("channelId"), includeChannelRecipients),
            ["recipientIds"],
         );

         return c.json(channel, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
