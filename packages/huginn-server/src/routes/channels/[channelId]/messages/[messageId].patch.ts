import {
   createErrorFactory,
   createHuginnError,
   globalPlugin,
   invalidBody,
   missingAccess,
   missingPermission,
   verifyJwt,
} from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectAllMessage } from "@huginn/backend-shared/database/common";
import { type APIMessage, Errors } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import { generateEmbedsFromContent, processEmbeds } from "#utils/route-utils";
import { validateEmbeds } from "#utils/validation";
import { filterMessage } from "#utils/helpers";
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
            thumbnail: t.Optional(t.Object({ url: t.String(), width: t.Optional(t.Number()), height: t.Optional(t.Number()) })),
         }),
      ),
   ),
   payload_json: t.Optional(t.String({ minLength: 1 })),
   files: t.Optional(t.Nullable(t.Record(t.String(), t.File()))),
});

export const patchMessage = new Elysia()
   .use(verifyJwt())
   .use(globalPlugin)
   .patch(
      "/api/channels/:channelId/messages/:messageId",
      async ({ tokenPayload, params: { channelId, messageId }, status, body, global }) => {
         // Check permission
         const channel = await prisma.channel.getById(channelId, { select: { id: true } });
         if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
            return missingAccess(status);
         }

         const messageToCheck = await prisma.message.getById(channelId, messageId, { select: { author: { select: { id: true } } } });
         if (messageToCheck.author.id !== tokenPayload.id) {
            return missingPermission(status);
         }

         // Body must have either content, attachment or embeds
         if (!body.content && !body.attachments && !body.embeds) {
            return invalidBody(status);
         }

         // Validate embeds
         const formError = createErrorFactory(Errors.invalidFormBody());
         if (body.embeds && !validateEmbeds(body.embeds, formError)) {
            return createHuginnError(formError, status);
         }

         const processedEmbeds = await processEmbeds(body.embeds);

         const dbMessage = await prisma.message.updateMessage(
            messageId,
            { content: body.content, embeds: processedEmbeds },
            { select: selectAllMessage },
         );

         const message: APIMessage = filterMessage(dbMessage);
         dispatchToTopic(channelId, "message_update", message);

         global.waitUntil(async () => {
            // Embed generation from urls inside the message content
            const embeds = await generateEmbedsFromContent(body.content);

            if (!embeds?.length) {
               return;
            }

            const updatedMessage = await prisma.message.updateMessage(message.id, { embeds }, { select: selectAllMessage });

            dispatchToTopic(channelId, "message_update", filterMessage(updatedMessage));
         });

         return status("OK", message);
      },
      {
         body: schema,
         transform(ctx) {
            const contentType = ctx.headers["content-type"];
            if (contentType?.includes("multipart/form-data") && ctx.body.payload_json) {
               const { payload_json, ...rest } = ctx.body;
               const json = JSON.parse(payload_json);
               const files = Object.keys(rest).length !== 0 ? { files: rest } : {};
               ctx.body = { ...json, ...files };
            }
         },
      },
   );
