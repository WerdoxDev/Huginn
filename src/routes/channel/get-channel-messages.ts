import { DBErrorType, prisma } from "@/src/db";
import { includeMessageAuthor, includeMessageMentions } from "@/src/db/common";
import { createError } from "@/src/factory/error-factory";
import { error, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetChannelMessagesResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { idFix, merge, omitArray } from "@shared/utils";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ limit: z.optional(z.string()) });

const app = new Hono();

app.get("/channels/:channelId/messages", verifyJwt(), hValidator("query", schema), c =>
   handleRequest(
      c,
      async () => {
         const query = c.req.valid("query");
         const limit = Number(query.limit) || 50;

         const messages: APIGetChannelMessagesResult = omitArray(
            idFix(
               await prisma.message.getMessages(c.req.param("channelId"), limit, merge(includeMessageAuthor, includeMessageMentions))
            ),
            ["authorId"]
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
