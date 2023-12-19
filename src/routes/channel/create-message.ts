import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIPostCreateDefaultMessageJSONBody, APIPostCreateDefaultMessageResult } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { omit } from "@shared/utility";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
   content: z.optional(z.string()),
   attachment: z.optional(z.unknown()),
   flags: z.optional(z.number()),
   nonce: z.optional(z.union([z.number(), z.string()])),
});

const app = new Hono();

app.post("/channels/:channelId/messages", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = (await c.req.json()) as APIPostCreateDefaultMessageJSONBody;
         const payload = getJwt(c);

         if (!body.content && !body.attachments) {
            return error(c, createError(Error.invalidFormBody()));
         }

         const message = omit(
            await prisma.message.createDefaultMessage(
               payload!.id,
               c.req.param("channelId"),
               body.content,
               body.attachments,
               body.flags,
            ),
            ["authorId", "mentionIds"],
         );

         return c.json(message as APIPostCreateDefaultMessageResult, HttpCode.CREATED);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()).error(e.error.cause, Field.invalidChannelId()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
