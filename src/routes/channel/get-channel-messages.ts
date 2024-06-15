import { DBErrorType, prisma } from "@/src/database";
import { includeMessageAuthor, includeMessageMentions } from "@/src/database/database-common";
import { createError } from "@/src/factory/error-factory";
import { error, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetChannelMessagesResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { merge, omitArray } from "@shared/utility";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ limit: z.optional(z.string()) });

const app = new Hono();

app.get("/channels/:channelId/messages", verifyJwt(), hValidator("query", schema), c =>
   handleRequest(
      c,
      async () => {
         const limit = Number(c.req.query("limit")) || 50;

         const messages: APIGetChannelMessagesResult = omitArray(
            await prisma.message.getMessages(c.req.param("channelId"), limit, merge(includeMessageAuthor, includeMessageMentions)),
            ["authorId", "mentionIds"]
         );

         // return c.json({}, HttpCode.SERVER_ERROR);
         return c.json(messages, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
