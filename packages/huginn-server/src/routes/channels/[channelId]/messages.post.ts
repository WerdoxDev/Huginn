import { createErrorFactory, createHuginnError, createRoute, invalidFormBody, missingAccess, verifyJwt, waitUntil } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessageDefaults } from "@huginn/backend-shared/database/common";
import { type APIMessage, Errors, HttpCode, MessageType, WorkerID, snowflake } from "@huginn/shared";
import { safeDestr } from "destr";
import { z } from "zod";
import { dispatchToTopic } from "#utils/gateway-utils";
import { generateEmbedsFromContent, processAttachments, processEmbeds } from "#utils/route-utils";
import { validateEmbeds } from "#utils/validation";
import { filterMessage } from "#utils/helpers";

const jsonSchema = z.object({
   content: z.optional(z.string()),
   attachments: z.optional(z.array(z.object({ id: z.number(), description: z.optional(z.string()), filename: z.string() }))),
   embeds: z.optional(
      z.array(
         z.object({
            type: z.enum(["rich", "image", "video"]),
            title: z.optional(z.string()),
            url: z.optional(z.string()),
            description: z.optional(z.string()),
            timestamp: z.optional(z.string()),
            thumbnail: z.optional(z.object({ url: z.string(), width: z.optional(z.number()), height: z.optional(z.number()) })),
         }),
      ),
   ),
   flags: z.optional(z.number()),
   nonce: z.optional(z.string()),
});

const formSchema = z.object({
   payload_json: z.string().nonempty(),
   files: z.record(z.string(), z.instanceof(File)),
});

createRoute("POST", "/api/channels/:channelId/messages", verifyJwt(), async (c) => {
   let body: z.infer<typeof jsonSchema>;
   let files: Record<string, File> = {};
   const contentType = c.req.header("Content-Type");

   if (contentType?.includes("application/json")) {
      const result = jsonSchema.safeParse(await c.req.json());

      if (!result.success) {
         return invalidFormBody(c);
      }

      body = result.data;
   } else if (contentType?.includes("multipart/form-data")) {
      const formData = await c.req.parseBody();
      const formFiles: Record<string, File> = {};
      for (const key of Object.keys(formData)) {
         if (key.startsWith("files[")) {
            formFiles[key] = formData[key] as File;
         }
      }

      const formResult = formSchema.safeParse({ ...formData, files: formFiles });
      const jsonResult = jsonSchema.safeParse(safeDestr(formData.payload_json as string));

      if (!formResult.success || !jsonResult.success) {
         return invalidFormBody(c);
      }

      body = jsonResult.data;
      files = formResult.data.files;
   } else {
      return invalidFormBody(c);
   }

   const payload = c.get("tokenPayload");
   const { channelId } = c.req.param();

   // Check permission
   const channel = await prisma.channel.getById(channelId, { select: { id: true } });
   if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
      return missingAccess(c);
   }

   // Body must have either content, attachment or embeds
   if (!body.content && !body.attachments && !body.embeds) {
      return invalidFormBody(c);
   }

   // Validate embeds
   const formError = createErrorFactory(Errors.invalidFormBody());
   if (body.embeds && !validateEmbeds(body.embeds, formError)) {
      return createHuginnError(c, formError);
   }

   // Validate attachments
   if (body.attachments) {
      for (const [i, attachment] of body.attachments.entries()) {
         if (!(`files[${attachment.id}]` in files) || files[`files[${i}]`].name !== attachment.filename) return invalidFormBody(c);
      }
   }

   const messageId = snowflake.generate(WorkerID.MESSAGE);

   const processedAttachments = await processAttachments(body.attachments, files, channelId, messageId.toString());

   // Fetch image data from embeds
   const processedEmbeds = await processEmbeds(body.embeds);

   const dbMessage = await prisma.message.createOne(
      {
         id: messageId,
         authorId: payload.id,
         channelId,
         type: MessageType.DEFAULT,
         content: body.content,
         attachments: processedAttachments,
         embeds: processedEmbeds.length === 0 ? undefined : processedEmbeds,
         flags: body.flags,
      },
      { select: selectMessageDefaults },
   );

   // dbMessage.attachments[0].

   const message: APIMessage = filterMessage(dbMessage);
   message.nonce = body.nonce;

   dispatchToTopic(channelId, "message_create", message);

   // update read state to be the new created message
   await prisma.readState.updateLastRead(payload.id, channelId, message.id);

   // Embed generation from urls inside the message content
   waitUntil(c, async () => {
      const embeds = await generateEmbedsFromContent(body.content);

      if (!embeds?.length) {
         return;
      }

      const updatedMessage = await prisma.message.updateMessage(dbMessage.id, { embeds }, { select: selectMessageDefaults });

      dispatchToTopic(channelId, "message_update", filterMessage(updatedMessage));
   });

   return c.json(message, HttpCode.CREATED);
});
