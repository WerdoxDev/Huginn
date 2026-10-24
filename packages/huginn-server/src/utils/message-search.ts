import type { APIPostChannelSearchJSONBody, MessageSearchHas, Snowflake } from "@huginnjs/shared";

import { assertId, type Prisma } from "@huginn/backend-shared/database";
import { ChannelType, MessageType } from "@huginnjs/shared";

/** PostgreSQL stores snowflakes as signed 64-bit integers. */
export function assertMessageSearchIdsValid(body: APIPostChannelSearchJSONBody): asserts body is typeof body {
   const methodName = "areMessageSearchIdsValid";
   if (body.channelId) assertId(methodName, body.channelId);
   if (body.authorId) assertId(methodName, body.authorId);
   if (body.minId) assertId(methodName, body.minId);
   if (body.maxId) assertId(methodName, body.maxId);
   if (body.repliedToUserId) assertId(methodName, body.repliedToUserId);
   if (body.repliedToMessageId) assertId(methodName, body.repliedToMessageId);
   if (body.mentions) assertId(methodName, ...body.mentions);
}

function escapeLikePattern(value: string): string {
   return value.replace(/[\\%_]/g, "\\$&");
}

const hasConditions: Record<MessageSearchHas, Prisma.MessageWhereInput> = {
   image: {
      OR: [
         { attachments: { some: { contentType: { startsWith: "image/", mode: "insensitive" } } } },
         { embeds: { some: { type: { in: ["image", "gifv"] } } } },
      ],
   },
   video: {
      OR: [
         { attachments: { some: { contentType: { startsWith: "video/", mode: "insensitive" } } } },
         { embeds: { some: { type: { in: ["video", "gifv"] } } } },
      ],
   },
   audio: { attachments: { some: { contentType: { startsWith: "audio/", mode: "insensitive" } } } },
   file: { attachments: { some: {} } },
   link: {
      OR: [
         { content: { contains: "http://", mode: "insensitive" } },
         { content: { contains: "https://", mode: "insensitive" } },
         { embeds: { some: { url: { not: null } } } },
      ],
   },
   embed: { embeds: { some: {} } },
};

export function buildMessageSearchWhere(userId: Snowflake, body: APIPostChannelSearchJSONBody): Prisma.MessageWhereInput {
   const conditions: Prisma.MessageWhereInput[] = [
      {
         channel: {
            type: { in: [ChannelType.DM, ChannelType.GROUP_DM] },
            OR: [{ recipients: { some: { id: BigInt(userId) } } }, { ownerId: BigInt(userId) }],
         },
      },
   ];

   if (body.channelId !== undefined) conditions.push({ channelId: BigInt(body.channelId) });
   if (body.authorId !== undefined) conditions.push({ authorId: BigInt(body.authorId) });
   if (body.content !== undefined) conditions.push({ content: { contains: escapeLikePattern(body.content), mode: "insensitive" } });
   if (body.pinned !== undefined) conditions.push({ pinned: body.pinned });
   if (body.minId !== undefined) conditions.push({ id: { lt: BigInt(body.minId) } });
   if (body.maxId !== undefined) conditions.push({ id: { gt: BigInt(body.maxId) } });
   if (body.types !== undefined) conditions.push({ type: { in: body.types } });

   for (const userId of body.mentions ?? []) conditions.push({ mentions: { some: { id: BigInt(userId) } } });
   for (const category of body.has ?? []) conditions.push(hasConditions[category]);

   if (body.attachmentFilename !== undefined || body.attachmentExtension !== undefined) {
      const extension = body.attachmentExtension?.replace(/^\./, "");
      const attachmentConditions: Prisma.AttachmentWhereInput[] = [];
      if (body.attachmentFilename !== undefined) {
         attachmentConditions.push({ filename: { contains: escapeLikePattern(body.attachmentFilename), mode: "insensitive" } });
      }
      if (extension !== undefined) attachmentConditions.push({ filename: { endsWith: escapeLikePattern(`.${extension}`), mode: "insensitive" } });
      conditions.push({ attachments: { some: { AND: attachmentConditions } } });
   }

   if (body.embedType !== undefined) conditions.push({ embeds: { some: { type: { equals: body.embedType, mode: "insensitive" } } } });
   if (body.repliedToUserId !== undefined || body.repliedToMessageId !== undefined) {
      conditions.push({
         type: MessageType.REPLY,
         messageReference: {
            is: {
               ...(body.repliedToMessageId !== undefined && { messageId: BigInt(body.repliedToMessageId) }),
               ...(body.repliedToUserId !== undefined && { message: { is: { authorId: BigInt(body.repliedToUserId) } } }),
            },
         },
      });
   }

   return { AND: conditions };
}
