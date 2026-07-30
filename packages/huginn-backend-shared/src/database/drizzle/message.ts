import { analytics, idFix, MessageType, recordSpanError, snowflake, WorkerID, type APIPostMessageReferenceJSONBody, type Snowflake } from "@huginnjs/shared";
import { PaginationType, type ScalarWhereField } from "better-drizzle";

import { assertExists, assertId, assertObj } from "#database/error";
import { DBErrorType, type DBAttachment, type DBCall, type DBEmbed } from "#index";

import type { MessageArgs, MessagePayload } from "./common";

import { attachmentRepo } from "./attachment";
import { channelRepo } from "./channel";
import { drizzle, schema } from "./db";
import { embedRepo } from "./embed";

export const messageRepo = {
   async getById<Args extends MessageArgs>(channelId: Snowflake, messageId: Snowflake, args?: Args) {
      return analytics.startActiveSpan("db.d.message.getById", async (span) => {
         span.setAttributes({ "query.channel.id": channelId, "query.message.id": messageId });
         const methodName = "message.getById";
         assertId(methodName, channelId, messageId);
         try {
            const message = await drizzle.message
               .findUnique({
                  where: {
                     channelId: BigInt(channelId),
                     id: BigInt(messageId),
                  },
                  ...args,
               })
               .throw();

            return idFix(message as MessagePayload<Args>);
         } catch (e) {
            recordSpanError(e);
            await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
            await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [messageId]);
            throw e;
         }
      });
   },
   async getMessages<Args extends MessageArgs>(channelId: Snowflake, limit: number, before?: Snowflake, after?: Snowflake, around?: Snowflake, args?: Args) {
      return analytics.startActiveSpan("db.d.message.getMessages", async (span) => {
         span.setAttributes({
            "query.channel.id": channelId,
            "query.limit": limit,
            "query.has_before": !!before,
            "query.has_after": !!after,
            "query.has_around": !!around,
         });

         const methodName = "message.getMessages";
         assertId(methodName, channelId);

         try {
            if (around) {
               span.setAttribute("query.around.id", around);
               assertId(methodName, around);
               const aroundId = around;
               const beforeCount = Math.max(Math.floor((limit - 1) / 2), 0);
               const afterCount = Math.max(limit - beforeCount - 1, 0);

               const beforeMessages =
                  beforeCount === 0
                     ? []
                     : (
                          await drizzle.message.paginate({
                             where: {
                                channelId: BigInt(channelId),
                                //   id: { lt: aroundId } as unknown as ScalarWhereField<string>,
                             },
                             before: { id: BigInt(aroundId) },
                             ...args,
                             orderBy: [{ id: "asc" }],
                             take: beforeCount,
                          })
                       ).data;
               // beforeMessages

               const aroundMessage = await drizzle.message.findFirst({
                  where: {
                     channelId: BigInt(channelId),
                     id: BigInt(aroundId),
                  },
                  ...args,
               });

               const afterMessages =
                  afterCount === 0
                     ? []
                     : (
                          await drizzle.message.paginate({
                             where: {
                                channelId: BigInt(channelId),
                             },
                             ...args,
                             after: { id: BigInt(aroundId) },
                             orderBy: [{ id: "desc" }],
                             take: afterCount,
                          })
                       ).data;

               const messages = [...beforeMessages.reverse(), ...(aroundMessage ? [aroundMessage] : []), ...afterMessages];

               span.setAttribute("messages.count", messages.length);
               assertObj(methodName, messages, DBErrorType.NULL_MESSAGE);
               return idFix(messages as MessagePayload<Args>[]);
            }

            const cursor = after ?? before;
            const direction = after ? "forward" : before ? "backward" : "none";

            span.setAttribute("cursor.direction", direction);

            const data = (
               await drizzle.message.paginate({
                  type: PaginationType.Cursor,
                  where: { channelId: BigInt(channelId) },
                  ...args,
                  orderBy: [{ id: direction === "forward" ? "asc" : "desc" }],
                  cursor: cursor ? { id: BigInt(cursor) } : undefined,
                  take: limit,
               })
            ).data;

            const messages = direction === "backward" || direction === "none" ? data.toReversed() : data;

            // const messages = await drizzle.message.findMany({
            //    where: { channelId: channelId },
            //    ...args,
            //    orderBy: { id: "desc" },
            //    cursor: cursor ? { id: cursor } : undefined,
            //    skip: direction === "none" ? undefined : 1,
            //    take: (direction === "forward" ? 1 : -1) * limit,
            // });

            span.setAttribute("messages.count", messages.length);

            assertObj(methodName, messages, DBErrorType.NULL_MESSAGE);
            return idFix(messages as MessagePayload<Args>[]);
         } catch (e) {
            recordSpanError(e);
            await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
            throw e;
         }
      });
   },
   async createOne<Args extends MessageArgs>(
      options: {
         id?: Snowflake;
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
      return analytics.startActiveSpan("db.message.createOne", async (span) => {
         span.setAttributes({
            "query.channel.id": options.channelId,
            "query.user.id": options.authorId,
            "query.message.type": options.type,
            "query.attachment.count": options.attachments?.length ?? 0,
            "query.embed.count": options.embeds?.length ?? 0,
            "query.mention.count": options.mentions?.length ?? 0,
            "query.has_reference": !!options.messageReference,
            "query.has_call": !!options.call,
            "query.call.participant_count": options.call?.participants?.length ?? 0,
            "query.has_custom_id": !!options.id,
         });

         const methodName = "message.createMessage";
         assertId(methodName, options.authorId, options.channelId);
         if (options.call) assertId(methodName, ...options.call.participants);
         if (options.messageReference) assertId(methodName, options.messageReference.channelId, options.messageReference.messageId);

         try {
            const createdEmbeds: (typeof schema.embed.$inferSelect)[] = [];
            const createdAttachments: (typeof schema.attachment.$inferSelect)[] = [];
            const participantsConnect = options.call?.participants?.map((x) => ({
               id: x,
            }));

            if (options.embeds) {
               for (const embed of options.embeds) {
                  createdEmbeds.push(
                     await embedRepo.createOne(embed.type, embed.title, embed.description, embed.url, embed.timestamp, embed.thumbnail, embed.video),
                  );
               }

               span.setAttribute("embeds.count", createdEmbeds.length);
            }

            if (options.attachments) {
               for (const attachment of options.attachments) {
                  createdAttachments.push(
                     await attachmentRepo.createOne(
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

               span.setAttribute("attachments.count", createdAttachments.length);
            }

            const messageId = options.id ?? snowflake.generateString(WorkerID.MESSAGE);
            const message = await drizzle.message.create({
               data: {
                  id: BigInt(messageId),
                  type: options.type,
                  channelId: BigInt(options.channelId),
                  content: options.content ?? "",
                  attachments: options.attachments ? { connect: createdAttachments.map((x) => ({ id: BigInt(x.id) })) } : undefined,
                  mentions: { connect: options.mentions?.map((x) => ({ id: BigInt(x) })) },
                  authorId: BigInt(options.authorId),
                  timestamp: options.timestamp ?? new Date(),
                  embeds: options.embeds ? { connect: createdEmbeds.map((x) => ({ id: BigInt(x.id) })) } : undefined,
                  editedTimestamp: null,
                  pinned: false,
                  reactions: undefined,
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
                  messageReference: {},
               },
               ...args,
            });

            span.setAttribute("message.id", message.id.toString());

            // Has select none with {id : true}
            await drizzle.channel.updateMany({
               where: { id: BigInt(options.channelId), OR: [{ lastMessageId: null }, { lastMessageId: { lt: BigInt(messageId) } }] },
               data: { lastMessageId: BigInt(messageId) },
            });

            assertObj(methodName, message, DBErrorType.NULL_MESSAGE);
            return idFix(message as MessagePayload<Args>);
         } catch (e) {
            recordSpanError(e);
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
      });
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
      return analytics.startActiveSpan("db.message.updateMessage", async (span) => {
         span.setAttributes({
            "query.message.id": id,
            "query.embeds.count": options.embeds?.length ?? 0,
            "query.has_call": !!options.call,
            "query.call.participant_count": options.call?.participants.length ?? 0,
            "query.call.set_ended_timestamp": options.call?.setEndedTimestamp ?? false,
            "query.has_content": options.content !== undefined,
         });

         const methodName = "message.updateMessage";
         assertId(methodName, id);
         try {
            const createdEmbeds: (typeof schema.embed.$inferSelect)[] = [];
            const participantsConnect = options.call?.participants.map((x) => ({
               id: BigInt(x),
            }));

            if (options.embeds) {
               for (const embed of options.embeds) {
                  createdEmbeds.push(
                     await embedRepo.createOne(embed.type, embed.title, embed.description, embed.url, embed.timestamp, embed.thumbnail, embed.video),
                  );
               }

               span.setAttribute("embeds.count", createdEmbeds.length);
            }

            const message = await drizzle.message
               .update({
                  where: { id: BigInt(id) },
                  data: {
                     content: options.content,
                     embeds: options.embeds ? { set: createdEmbeds.map((x) => ({ id: BigInt(x.id) })) } : { set: [] },
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
               })
               .throw();

            span.setAttribute("message.id", message.id.toString());

            assertObj(methodName, message, DBErrorType.NULL_MESSAGE);
            return idFix(message as MessagePayload<Args>);
         } catch (e) {
            recordSpanError(e);
            await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [id]);
            throw e;
         }
      });
   },
   async deleteById<Args extends MessageArgs>(id: Snowflake, channelId: Snowflake, args?: Args) {
      return analytics.startActiveSpan("db.message.deleteById", async (span) => {
         span.setAttributes({ "query.message.id": id, "query.channel.id": channelId });

         const methodName = "message.deleteById";
         assertId(methodName, id, channelId);
         try {
            const channel = await channelRepo.getById(channelId, {
               select: { lastMessageId: true },
            });

            span.setAttribute("channel.last_message_id", channel?.lastMessageId?.toString() ?? "null");

            const deletePromise = drizzle.message.delete({ where: { id: BigInt(id), channelId: BigInt(channelId) }, ...args });

            let deletedMessage;
            // If this is null it means the channel has no messages anymore
            label: if (channel.lastMessageId === id) {
               const lastMessage = await drizzle.message.findFirst({
                  where: {
                     channelId: BigInt(channelId),
                     id: { not: BigInt(id) },
                  },
                  orderBy: { id: "desc" },
                  select: { id: true },
               });

               if (!lastMessage) break label;

               span.setAttribute("last_message.id", lastMessage.id.toString());

               const message = await drizzle.transaction(async (tx) => {
                  tx.channel.update({
                     where: { id: BigInt(channelId) },
                     data: { lastMessageId: lastMessage.id },
                  });

                  tx.readState.updateMany({
                     where: { channelId: BigInt(channelId), lastReadMessageId: BigInt(id) },
                     data: { lastReadMessageId: lastMessage.id },
                  });

                  return await deletePromise;
               });

               deletedMessage = message;
            } else {
               deletedMessage = await deletePromise;
            }

            if (deletedMessage) span.setAttribute("deleted_message.id", deletedMessage.id.toString());

            assertObj(methodName, deletedMessage, DBErrorType.NULL_MESSAGE);
            return idFix(deletedMessage as MessagePayload<Args>);
         } catch (e) {
            recordSpanError(e);
            await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [id]);
            await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
            throw e;
         }
      });
   },
};
