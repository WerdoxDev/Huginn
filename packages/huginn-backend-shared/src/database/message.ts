import type { APIPostMessageReferenceJSONBody, BigIntToString, Snowflake } from "@huginn/shared";

import { assertExists, assertId, assertObj, prisma, type MessageArgs, type MessagePayload, Prisma } from "#database";
import { type Attachment, type Embed } from "#prisma/client";
import { type DBAttachment, type DBCall, type DBEmbed, DBErrorType } from "#types";
import { WorkerID, idFix, snowflake } from "@huginn/shared";
import { MessageType } from "@huginn/shared";

export const messagesExtension = Prisma.defineExtension({
   model: {
      message: {
         async getById<Args extends MessageArgs>(channelId: Snowflake, messageId: Snowflake, args?: Args) {
            const methodName = "message.getById";
            assertId(methodName, channelId, messageId);
            try {
               const message = await prisma.message.findUnique({
                  where: {
                     channelId: BigInt(channelId),
                     id: BigInt(messageId),
                  },
                  ...args,
               });

               assertObj(methodName, message, DBErrorType.NULL_MESSAGE, messageId);
               return idFix(message) as MessagePayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [messageId]);
               throw e;
            }
         },
         async getMessages<Args extends MessageArgs>(
            channelId: Snowflake,
            limit: number,
            before?: Snowflake,
            after?: Snowflake,
            around?: Snowflake,
            args?: Args,
         ) {
            const methodName = "message.getMessages";
            assertId(methodName, channelId);

            try {
               if (around) {
                  assertId(methodName, around);
                  const aroundId = BigInt(around);
                  const beforeCount = Math.max(Math.floor((limit - 1) / 2), 0);
                  const afterCount = Math.max(limit - beforeCount - 1, 0);

                  const beforeMessages =
                     beforeCount === 0
                        ? []
                        : await prisma.message.findMany({
                             where: {
                                channelId: BigInt(channelId),
                                id: { lt: aroundId },
                             },
                             ...args,
                             orderBy: { id: "desc" },
                             take: beforeCount,
                          });

                  const aroundMessage = await prisma.message.findFirst({
                     where: {
                        channelId: BigInt(channelId),
                        id: aroundId,
                     },
                     ...args,
                  });

                  const afterMessages =
                     afterCount === 0
                        ? []
                        : await prisma.message.findMany({
                             where: {
                                channelId: BigInt(channelId),
                                id: { gt: aroundId },
                             },
                             ...args,
                             orderBy: { id: "asc" },
                             take: afterCount,
                          });

                  const messages = [...beforeMessages.reverse(), ...(aroundMessage ? [aroundMessage] : []), ...afterMessages];

                  assertObj(methodName, messages, DBErrorType.NULL_MESSAGE);
                  return idFix(messages) as BigIntToString<Prisma.MessageGetPayload<Args>[]>;
               }

               const cursor = after ?? before;
               const direction = after ? "forward" : before ? "backward" : "none";

               const messages = await prisma.message.findMany({
                  where: { channelId: BigInt(channelId) },
                  ...args,
                  orderBy: { id: "asc" },
                  cursor: cursor ? { id: BigInt(cursor) } : undefined,
                  skip: direction === "none" ? undefined : 1,
                  take: (direction === "forward" ? 1 : -1) * limit,
               });

               assertObj(methodName, messages, DBErrorType.NULL_MESSAGE);
               return idFix(messages) as BigIntToString<Prisma.MessageGetPayload<Args>[]>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               throw e;
            }
         },
         async createOne<Args extends MessageArgs>(
            options: {
               id?: bigint;
               authorId: Snowflake;
               channelId: Snowflake;
               type: MessageType;
               content?: string;
               attachments?: DBAttachment[];
               embeds?: DBEmbed[];
               messageReference?: APIPostMessageReferenceJSONBody;
               mentions?: Snowflake[];
               flags?: number;
               call?: DBCall;
               timestamp?: Date;
            },
            args?: Args,
         ) {
            const methodName = "message.createMessage";
            assertId(methodName, options.authorId, options.channelId);
            if (options.call) {
               assertId(methodName, ...options.call.participants);
            }
            if (options.messageReference) {
               assertId(methodName, options.messageReference.channelId, options.messageReference.messageId);
            }

            try {
               const createdEmbeds: Embed[] = [];
               const createdAttachments: Attachment[] = [];
               const participantsConnect = options.call?.participants?.map((x) => ({
                  id: BigInt(x),
               }));

               if (options.embeds) {
                  for (const embed of options.embeds) {
                     createdEmbeds.push(
                        await prisma.embed.createOne(
                           embed.type,
                           embed.title,
                           embed.description,
                           embed.url,
                           embed.timestamp,
                           embed.thumbnail,
                           embed.video,
                        ),
                     );
                  }
               }

               if (options.attachments) {
                  for (const attachment of options.attachments) {
                     createdAttachments.push(
                        await prisma.attachment.createOne(
                           attachment.filename,
                           attachment.contentType,
                           attachment.size,
                           attachment.url,
                           attachment.flags,
                           attachment.width,
                           attachment.height,
                           attachment.description,
                        ),
                     );
                  }
               }

               const messageId = options.id ?? snowflake.generate(WorkerID.MESSAGE);
               const message = await prisma.message.create({
                  data: {
                     id: messageId,
                     type: options.type,
                     channelId: BigInt(options.channelId),
                     content: options.content ?? "",
                     attachments: options.attachments ? { connect: createdAttachments.map((x) => ({ id: x.id })) } : undefined,
                     mentions: { connect: options.mentions?.map((x) => ({ id: BigInt(x) })) },
                     authorId: BigInt(options.authorId),
                     timestamp: options.timestamp ?? new Date(),
                     embeds: options.embeds ? { connect: createdEmbeds.map((x) => ({ id: x.id })) } : undefined,
                     editedTimestamp: null,
                     pinned: false,
                     reactions: [],
                     flags: options.flags ?? 0,
                     call:
                        participantsConnect && participantsConnect.length !== 0 && options.type === MessageType.CALL
                           ? {
                                create: {
                                   id: snowflake.generate(WorkerID.CALL),
                                   endedTimestamp: options.call?.endedTimestamp ?? null,
                                   participants: { connect: participantsConnect },
                                },
                             }
                           : undefined,
                     messageReference:
                        options.messageReference && (options.type === MessageType.REPLY || options.type === MessageType.CHANNEL_PINNED_MESSAGE)
                           ? {
                                create: {
                                   id: snowflake.generate(WorkerID.MESSAGE_REFERENCE),
                                   type: options.messageReference.type,
                                   channelId: BigInt(options.messageReference.channelId),
                                   messageId: BigInt(options.messageReference.messageId),
                                },
                             }
                           : undefined,
                  },
                  ...args,
               });

               // Has select none with {id : true}
               await prisma.channel.updateMany({
                  where: { id: BigInt(options.channelId), OR: [{ lastMessageId: null }, { lastMessageId: { lt: messageId } }] },
                  data: { lastMessageId: messageId },
               });

               assertObj(methodName, message, DBErrorType.NULL_MESSAGE);
               return idFix(message) as MessagePayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [options.authorId]);
               if (options.call?.participants) {
                  await assertExists(e, methodName, DBErrorType.NULL_USER, options.call.participants);
               }
               if (options.messageReference) {
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.messageReference.channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [options.messageReference.messageId]);
               }
               throw e;
            }
         },
         async updateMessage<Args extends MessageArgs>(
            id: Snowflake,
            options: {
               content?: string;
               embeds?: DBEmbed[];
               attachments?: DBAttachment[];
               call?: { participants: Snowflake[]; setEndedTimestamp: boolean };
            },
            args?: Args,
         ) {
            const methodName = "message.updateMessage";
            assertId(methodName, id);
            try {
               const createdEmbeds: Embed[] = [];
               const participantsConnect = options.call?.participants.map((x) => ({
                  id: BigInt(x),
               }));

               if (options.embeds) {
                  for (const embed of options.embeds) {
                     createdEmbeds.push(
                        await prisma.embed.createOne(
                           embed.type,
                           embed.title,
                           embed.description,
                           embed.url,
                           embed.timestamp,
                           embed.thumbnail,
                           embed.video,
                        ),
                     );
                  }
               }

               const message = await prisma.message.update({
                  where: { id: BigInt(id) },
                  data: {
                     content: options.content,
                     embeds: options.embeds ? { set: createdEmbeds.map((x) => ({ id: x.id })) } : { set: [] },
                     editedTimestamp: new Date(),
                     call: options.call
                        ? {
                             update: {
                                endedTimestamp: options.call.setEndedTimestamp ? new Date() : undefined,
                                participants: { set: participantsConnect },
                             },
                          }
                        : undefined,
                  },
                  ...args,
               });

               assertObj(methodName, message, DBErrorType.NULL_MESSAGE);
               return idFix(message) as MessagePayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [id]);
               throw e;
            }
         },
         async deleteById<Args extends MessageArgs>(id: Snowflake, channelId: Snowflake, args?: Args) {
            const methodName = "message.deleteById";
            assertId(methodName, id, channelId);
            try {
               const channel = await prisma.channel.getById(channelId, {
                  select: { lastMessageId: true },
               });

               const deletePromise = prisma.message.delete({ where: { id: BigInt(id), channelId: BigInt(channelId) }, ...args });

               let deletedMessage;
               // If this is null it means the channel has no messages anymore
               label: if (channel.lastMessageId === id) {
                  const lastMessage = await prisma.message.findFirst({
                     where: {
                        channelId: BigInt(channelId),
                        id: { not: BigInt(id) },
                     },
                     orderBy: { id: "desc" },
                     select: { id: true },
                  });

                  if (!lastMessage) break label;

                  const [, , message] = await prisma.$transaction([
                     prisma.channel.update({
                        where: { id: BigInt(channelId) },
                        data: { lastMessageId: lastMessage.id },
                     }),

                     prisma.readState.updateMany({
                        where: { channelId: BigInt(channelId), lastReadMessageId: BigInt(id) },
                        data: { lastReadMessageId: lastMessage.id },
                     }),
                     deletePromise,
                  ]);

                  deletedMessage = message;
               } else {
                  deletedMessage = await deletePromise;
               }

               assertObj(methodName, deletedMessage, DBErrorType.NULL_MESSAGE);
               return idFix(deletedMessage) as MessagePayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [id]);
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               throw e;
            }
         },
      },
   },
});
