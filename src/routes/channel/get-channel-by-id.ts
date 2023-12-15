import { DBErrorType } from "@/src/database";
import { DatabaseChannel } from "@/src/database/database-channel";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const channel = await DatabaseChannel.getChannelById(c.req.param("channelId"));

         return c.json(channel.toObject(), HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
