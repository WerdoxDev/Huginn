import { DBErrorType, prisma } from "@/src/db";
import { includeMessageAuthor, includeMessageMentions } from "@/src/db/common";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetMessageByIdResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { idFix, merge, omit } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId/messages/:messageId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const message: APIGetMessageByIdResult = omit(
            idFix(
               await prisma.message.getById(
                  c.req.param("channelId"),
                  c.req.param("messageId"),
                  merge(includeMessageAuthor, includeMessageMentions)
               )
            ),
            ["authorId"]
         );

         return c.json(message, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_MESSAGE)) {
            return error(c, createError(Error.unknownMessage()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
