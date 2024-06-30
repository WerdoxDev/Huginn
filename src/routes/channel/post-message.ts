import { DBErrorType, prisma } from "@/src/db";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, hValidator, handleRequest, invalidFormBody, verifyJwt } from "@/src/route-utils";
import { APIMessage, APIPostDefaultMessageResult } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { GatewayDispatchEvents, GatewayMessageCreateDispatch } from "@shared/gateway-types";
import { idFix, omit } from "@shared/utils";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
   content: z.optional(z.string()),
   attachments: z.optional(z.array(z.string())),
   flags: z.optional(z.number()),
   nonce: z.optional(z.union([z.number(), z.string()])),
});

const app = new Hono();

app.post("/channels/:channelId/messages", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = c.req.valid("json");
         const payload = getJwt(c);

         if (!body.content && !body.attachments) {
            return invalidFormBody(c);
         }

         const channelId = c.req.param("channelId");

         const message: APIMessage = omit(
            idFix(
               await prisma.message.createDefaultMessage(payload!.id, channelId, body.content, body.attachments, body.flags, {
                  author: true,
                  mentions: true,
               })
            ),
            ["authorId"]
         );

         message.nonce = body.nonce;

         dispatchToTopic<GatewayMessageCreateDispatch>(channelId, GatewayDispatchEvents.MESSAGE_CREATE, message, 0);

         return c.json(message as APIPostDefaultMessageResult, HttpCode.CREATED);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return error(c, createError(Error.unknownChannel()).error(e.error.cause, Field.invalidChannelId()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
