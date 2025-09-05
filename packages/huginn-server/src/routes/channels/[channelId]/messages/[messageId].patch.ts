import {
   createErrorFactory,
   createHuginnError,
   createRoute,
   invalidFormBody,
   missingAccess,
   missingPermission,
   verifyJwt,
   waitUntil,
} from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessageDefaults } from "@huginn/backend-shared/database/common";
import { type APIMessage, Errors, HttpCode } from "@huginn/shared";
import { safeDestr } from "destr";
import { z } from "zod";
import { dispatchToTopic } from "#utils/gateway-utils";
import { generateEmbedsFromContent, processEmbeds } from "#utils/route-utils";
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
});

const formSchema = z.object({
   payload_json: z.string().nonempty(),
   files: z.record(z.string(), z.instanceof(File)),
});

createRoute("PATCH", "/api/channels/:channelId/messages/:messageId", verifyJwt(), async (c) => {
   let body: z.infer<typeof jsonSchema>;
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
   } else {
      return invalidFormBody(c);
   }

   const payload = c.get("tokenPayload");
   const { channelId, messageId } = c.req.param();

   // Check permission
   const channel = await prisma.channel.getById(channelId, { select: { id: true } });
   if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
      return missingAccess(c);
   }

   const messageToCheck = await prisma.message.getById(channelId, messageId, { select: { author: { select: { id: true } } } });
   if (messageToCheck.author.id !== payload.id) {
      return missingPermission(c);
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

   const processedEmbeds = await processEmbeds(body.embeds);

   const dbMessage = await prisma.message.updateMessage(
      messageId,
      { content: body.content, embeds: processedEmbeds },
      { select: selectMessageDefaults },
   );

   const message: APIMessage = filterMessage(dbMessage);
   dispatchToTopic(channelId, "message_update", message);

   // Embed generation from urls inside the message content
   waitUntil(c, async () => {
      const embeds = await generateEmbedsFromContent(body.content);

      if (!embeds?.length) {
         return;
      }

      const updatedMessage = await prisma.message.updateMessage(dbMessage.id, { embeds }, { select: selectMessageDefaults });

      dispatchToTopic(channelId, "message_update", filterMessage(updatedMessage));
   });

   return c.json(message, HttpCode.OK);
});
