import { HttpCode, Error } from "@shared/errors";
import { DBErrorType } from "@/src/database";
import { DatabaseMessage } from "@/src/database/database-message";
import { createError } from "@/src/factory/error-factory";
import { error, verifyJwt, handleRequest } from "@/src/route-utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/channels/:channelId/messages/:messageId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const message = await DatabaseMessage.getMessageById(c.req.param("channelId"), c.req.param("messageId"));

         return c.json(message.toObject(), HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_MESSAGE)) {
            return error(c, createError(Error.unknownMessage()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
