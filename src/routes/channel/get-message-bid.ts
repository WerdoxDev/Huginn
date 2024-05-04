import { DBErrorType, prisma } from "@/src/database";
import { includeMessageAuthor, includeMessageMentions } from "@/src/database/database-common";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetMessageByIdResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { merge, omit } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId/messages/:messageId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const message: APIGetMessageByIdResult = omit(
            await prisma.message.getById(
               c.req.param("channelId"),
               c.req.param("messageId"),
               merge(includeMessageAuthor, includeMessageMentions),
            ),
            ["authorId"],
         );

         return c.json(message, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_MESSAGE)) {
            return error(c, createError(Error.unknownMessage()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
