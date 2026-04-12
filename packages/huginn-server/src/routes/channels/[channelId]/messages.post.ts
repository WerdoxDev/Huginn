import { dispatchToTopic } from "#utils/gateway-utils";
import { filterMessage } from "#utils/helpers";
import { generateEmbedsFromContent, processAttachments, processEmbeds } from "#utils/route-utils";
import { validateEmbeds } from "#utils/validation";
import { createErrorFactory, createHuginnError, globalPlugin, invalidBody, missingAccess, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIMessage, Errors, MessageType, WorkerID, snowflake } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   content: t.Optional(t.String()),
   attachments: t.Optional(t.Array(t.Object({ id: t.Number(), description: t.Optional(t.String()), filename: t.String() }))),
   embeds: t.Optional(
      t.Array(
         t.Object({
            type: t.Union([t.Literal("rich"), t.Literal("image"), t.Literal("video")]),
            title: t.Optional(t.String()),
            url: t.Optional(t.String()),
            description: t.Optional(t.String()),
            timestamp: t.Optional(t.String()),
            thumbnail: t.Optional(
               t.Object({
                  url: t.String(),
                  width: t.Optional(t.Number()),
                  height: t.Optional(t.Number()),
               }),
            ),
         }),
      ),
   ),
   messageReference: t.Optional(t.Object({ type: t.Number(), messageId: t.String(), channelId: t.String() })),
   flags: t.Optional(t.Number()),
   nonce: t.Optional(t.String()),
   payload_json: t.Optional(t.Union([t.String({ minLength: 1 }), t.Record(t.String(), t.Unknown())])),
   files: t.Optional(t.Array(t.File())),
});

export const postChannelMessage = new Elysia()
   .use(globalPlugin)
   .use(verifyJwt())
   .post(
      "/api/channels/:channelId/messages",
      async ({ params: { channelId }, body, tokenPayload, status, global }) => {
         // Check permission
         const channel = await prisma.channel.getById(channelId, { select: { id: true } });
         if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
            return missingAccess(status);
         }

         // Body must have either content, attachment or embeds
         if (!body.content && !body.attachments && !body.embeds) {
            return invalidBody(status);
         }

         // Validate embeds
         const formError = createErrorFactory(Errors.invalidFormBody());
         if (body.embeds && !validateEmbeds(body.embeds, formError)) {
            return createHuginnError(formError, status, "Bad Request");
         }

         // Validate attachments
         console.log(body.attachments, body.files);
         if (body.attachments && body.files) {
            console.log(body.files);
            for (const attachment of body.attachments) {
               // console.log(body.files);
               if (!body.files[attachment.id] || body.files[attachment.id]?.name !== attachment.filename) return invalidBody(status);
            }
         }

         const messageId = snowflake.generate(WorkerID.MESSAGE);

         const processedAttachments = await processAttachments(body.attachments, body.files, channelId, messageId.toString());

         // Fetch image data from embeds
         const processedEmbeds = await processEmbeds(body.embeds);

         const dbMessage = await prisma.message.createOne(
            {
               id: messageId,
               authorId: tokenPayload.id,
               channelId,
               type: body.messageReference ? MessageType.REPLY : MessageType.DEFAULT,
               content: body.content,
               attachments: processedAttachments,
               messageReference: body.messageReference,
               embeds: processedEmbeds.length === 0 ? undefined : processedEmbeds,
               flags: body.flags,
            },
            { select: selectAllMessage },
         );

         const message: APIMessage = filterMessage(dbMessage);
         message.nonce = body.nonce;
         dispatchToTopic(channelId, "message_create", message);

         global.waitUntil(async () => {
            await tryCatch(() => prisma.readState.updateLastRead(tokenPayload.id, channelId, message.id));
            // dispatchToTopic(tokenPayload.id, "message_ack", { channelId, messageId: message.id });

            // Embed generation from urls inside the message content
            const embeds = await generateEmbedsFromContent(body.content);

            if (!embeds?.length) {
               return;
            }

            const updatedMessage = await prisma.message.updateMessage(message.id, { embeds }, { select: selectAllMessage });

            dispatchToTopic(channelId, "message_update", filterMessage(updatedMessage));
         });

         return status("Created", message);
      },
      {
         body: schema,
         transform(ctx) {
            const contentType = ctx.headers["content-type"];
            if (contentType?.includes("multipart/form-data") && ctx.body.payload_json) {
               const { payload_json, files } = ctx.body;
               const json = typeof payload_json === "string" ? JSON.parse(payload_json) : payload_json;
               ctx.body = { ...json, files };
            }
         },
      },
   );
