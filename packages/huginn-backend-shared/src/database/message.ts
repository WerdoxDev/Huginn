import type { BigIntToString, Snowflake } from "@huginn/shared";
import { WorkerID, idFix, snowflake } from "@huginn/shared";
import { MessageType } from "@huginn/shared";
import { type Attachment, type Embed, Prisma } from "@prisma/client";
import { type DBAttachment, type DBCall, type DBEmbed, DBErrorType } from "#types";
import { assertExists, assertId, assertObj, prisma } from ".";

export const messagesExtension = Prisma.defineExtension({
   model: {
      message: {
         async getById<Args extends Prisma.MessageDefaultArgs>(channelId: Snowflake, messageId: Snowflake, args?: Args) {
            try {
               assertId("getById", channelId, messageId);
               const message = await prisma.message.findUnique({
                  where: { channelId: BigInt(channelId), id: BigInt(messageId) },
                  ...args,
               });

               assertObj("getById", message, DBErrorType.NULL_MESSAGE, messageId);
               return idFix(message) as BigIntToString<Prisma.MessageGetPayload<Args>>;
            } catch (e) {
               await assertExists(e, "getById", DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, "getById", DBErrorType.NULL_MESSAGE, [messageId]);
               throw e;
            }
         },
         async getMessages<Args extends Prisma.MessageDefaultArgs>(
            channelId: Snowflake,
            limit: number,
            before?: Snowflake,
            after?: Snowflake,
            args?: Args,
         ) {
            try {
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

               assertObj("getMessages", messages, DBErrorType.NULL_MESSAGE);
               return idFix(messages) as BigIntToString<Prisma.MessageGetPayload<Args>[]>;
            } catch (e) {
               await assertExists(e, "getMessages", DBErrorType.NULL_CHANNEL, [channelId]);
               throw e;
            }
         },
         async createMessage<Args extends Prisma.MessageDefaultArgs>(
            options: {
               id?: bigint;
               authorId: Snowflake;
               channelId: Snowflake;
               type: MessageType;
               content?: string;
               attachments?: DBAttachment[];
               embeds?: DBEmbed[];
               mentions?: Snowflake[];
               flags?: number;
               call?: DBCall;
               timestamp?: Date;
            },
            args?: Args,
         ) {
            try {
               const createdEmbeds: Embed[] = [];
               const createdAttachments: Attachment[] = [];
               const participantsConnect = options.call?.participants?.map((x) => ({ id: BigInt(x) }));

               if (options.embeds) {
                  for (const embed of options.embeds) {
                     createdEmbeds.push(
                        await prisma.embed.createEmbed(
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
                        await prisma.attachment.createAttachment(
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
                  },
                  ...args,
               });

               // Has select none with {id : true}
               await prisma.channel.update({ where: { id: BigInt(options.channelId) }, data: { lastMessageId: message.id }, select: { id: true } });

               assertObj("createMessage", message, DBErrorType.NULL_MESSAGE);
               return idFix(message) as BigIntToString<Prisma.MessageGetPayload<Args>>;
            } catch (e) {
               await assertExists(e, "createMessage", DBErrorType.NULL_CHANNEL, [options.channelId]);
               await assertExists(e, "createMessage", DBErrorType.NULL_USER, [options.authorId]);
               if (options.call?.participants) {
                  await assertExists(e, "createMessage", DBErrorType.NULL_USER, options.call.participants);
               }
               throw e;
            }
         },
         async updateMessage<Args extends Prisma.MessageDefaultArgs>(
            id: Snowflake,
            options: {
               content?: string;
               embeds?: DBEmbed[];
               attachments?: DBAttachment[];
               call?: { participants: Snowflake[]; setEndedTimestamp: boolean };
            },
            args?: Args,
         ) {
            try {
               const createdEmbeds: Embed[] = [];
               const participantsConnect = options.call?.participants.map((x) => ({ id: BigInt(x) }));

               if (options.embeds) {
                  for (const embed of options.embeds) {
                     createdEmbeds.push(
                        await prisma.embed.createEmbed(
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

               assertObj("updateMessage", message, DBErrorType.NULL_MESSAGE);
               return idFix(message) as BigIntToString<Prisma.MessageGetPayload<Args>>;
            } catch (e) {
               await assertExists(e, "updateMessage", DBErrorType.NULL_MESSAGE, [id]);
               throw e;
            }
         },
         async deleteById<Args extends Prisma.MessageDefaultArgs>(id: Snowflake, channelId: Snowflake, args?: Args) {
            try {
               let deletedMessage: Prisma.MessageGetPayload<Args> | undefined;

               await prisma.$transaction(async (tx) => {
                  const channel = await tx.channel.getById(channelId, { select: { lastMessageId: true } });
                  if (channel.lastMessageId === id) {
                     const lastMessage = await tx.message.findFirst({
                        where: { channelId: BigInt(channelId), id: { not: BigInt(id) } },
                        orderBy: { id: "desc" },
                        select: { id: true, authorId: true },
                     });

                     console.log(lastMessage);

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

                  deletedMessage = (await tx.message.delete({ where: { id: BigInt(id) }, ...args })) as Prisma.MessageGetPayload<Args>;
               });

               assertObj("deleteMessage", deletedMessage, DBErrorType.NULL_MESSAGE);
               return idFix(deletedMessage) as BigIntToString<Prisma.MessageGetPayload<Args>>;
            } catch (e) {
               await assertExists(e, "deleteMessage", DBErrorType.NULL_MESSAGE, [id]);
               throw e;
            }
         },
      },
   },
});
