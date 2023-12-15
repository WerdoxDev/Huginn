import { DBErrorType } from "@/src/database";
import { DatabaseMessage } from "@/src/database/database-message";
import { createError } from "@/src/factory/error-factory";
import { error, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetChannelMessagesResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ limit: z.optional(z.string()) });

const app = new Hono();

app.get("/channels/:channelId/messages", verifyJwt(), hValidator("query", schema), c =>
   handleRequest(
      c,
      async () => {
         const limit = Number(c.req.query("limit")) || 50;

         const messages = await DatabaseMessage.getMessages(c.req.param("channelId"), limit);
         const json: APIGetChannelMessagesResult = messages.map(x => x.toObject());

         return c.json(json, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
