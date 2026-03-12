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
                     deletedTimestamp: null,
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
         async getMessages<Args extends MessageArgs>(channelId: Snowflake, limit: number, before?: Snowflake, after?: Snowflake, args?: Args) {
            const methodName = "message.getMessages";
            assertId(methodName, channelId);
            try {
               const cursor = after ?? before;
               const direction = after ? "forward" : before ? "backward" : "none";

               const messages = await prisma.message.findMany({
                  where: { channelId: BigInt(channelId), deletedTimestamp: null },
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

               const message = await prisma.message.create({
                  data: {
                     id: options.id ?? snowflake.generate(WorkerID.MESSAGE),
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
                        options.messageReference && options.type === MessageType.REPLY
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
               await prisma.channel.update({
                  where: { id: BigInt(options.channelId) },
                  data: { lastMessageId: message.id },
                  select: { id: true },
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
                  where: { id: BigInt(id), deletedTimestamp: null },
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
               let deletedMessage: Prisma.MessageGetPayload<Args> | undefined;

               await prisma.$transaction(async (tx) => {
                  const channel = await tx.channel.getById(channelId, {
                     select: { lastMessageId: true },
                  });
                  if (channel.lastMessageId === id) {
                     const lastMessage = await tx.message.findFirst({
                        where: {
                           channelId: BigInt(channelId),
                           id: { not: BigInt(id) },
                           deletedTimestamp: null,
                        },
                        orderBy: { id: "desc" },
                        select: { id: true },
                     });

                     // If this is null it means the channel has no messages anymore
                     if (lastMessage) {
                        await tx.channel.update({
                           where: { id: BigInt(channelId) },
                           data: { lastMessageId: lastMessage.id },
                        });

                        await tx.readState.updateMany({
                           where: { channelId: BigInt(channelId), lastReadMessageId: BigInt(id) },
                           data: { lastReadMessageId: lastMessage.id },
                        });
                     }
                  }

                  deletedMessage = (await tx.message.update({
                     where: {
                        id: BigInt(id),
                        channelId: BigInt(channelId),
                        deletedTimestamp: null,
                     },
                     data: { deletedTimestamp: new Date() },
                     ...args,
                  })) as Prisma.MessageGetPayload<Args>;
               });

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
