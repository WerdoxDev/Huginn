import { prisma } from "@/db";
import { dispatchToTopic } from "@/gateway/gateway-utils";
import { getJwt, hValidator, handleRequest, verifyJwt } from "@/route-utils";
import { invalidFormBody } from "@huginn/backend-shared";
import { APIMessage, HttpCode, idFix, omit } from "@huginn/shared";
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
   handleRequest(c, async () => {
      const body = c.req.valid("json");
      const payload = getJwt(c);

      if (!body.content && !body.attachments) {
         return invalidFormBody(c);
      }

      const channelId = c.req.param("channelId");

      const message: APIMessage = omit(
         idFix(
            await prisma.message.createDefaultMessage(payload.id, channelId, body.content, body.attachments, body.flags, {
               author: true,
               mentions: true,
            }),
         ),
         ["authorId"],
      );

      message.nonce = body.nonce;

      dispatchToTopic(channelId, "message_create", message, 0);
      // TODO: Don't send notification if message has SUPPRESS_NOTIFICATIONS

      return c.json(message, HttpCode.CREATED);
   }),
);

export default app;
