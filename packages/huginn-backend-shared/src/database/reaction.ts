import { analytics, idFix, recordSpanError, type Snowflake } from "@huginn/shared";

import { assertExists, assertId, assertObj, prisma, type ReactionArgs, type ReactionPayload } from "#database";
import { Prisma } from "#prisma/client";
import { DBErrorType } from "#types";

export const reactionExtension = Prisma.defineExtension({
   model: {
      reaction: {
         async getById<Args extends ReactionArgs>(options: { channelId: Snowflake; messageId: Snowflake; userId: Snowflake; emojiKey: string }, args?: Args) {
            return analytics.startActiveSpan("db.reaction.getById", async (span) => {
               span.setAttributes({
                  "query.user.id": options.userId,
                  "query.message.id": options.messageId,
                  "query.channel.id": options.channelId,
                  "query.emoji_key": options.emojiKey,
               });
               const methodName = "reaction.getById";
               try {
                  assertId(methodName, options.messageId, options.userId, options.channelId);

                  const reaction = await prisma.reaction.findUniqueOrThrow({
                     where: {
                        channelId_messageId_userId_emojiKey: {
                           channelId: BigInt(options.channelId),
                           messageId: BigInt(options.messageId),
                           userId: BigInt(options.userId),
                           emojiKey: options.emojiKey,
                        },
                     },
                     ...args,
                  });

                  return idFix(reaction) as ReactionPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [options.userId]);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [options.messageId]);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_EMOJI, [options.emojiKey]);
                  throw e;
               }
            });
         },
         async hasUserReacted(options: { channelId: Snowflake; messageId: Snowflake; userId: Snowflake; emojiKey: string }) {
            return analytics.startActiveSpan("db.reaction.hasUserReacted", async (span) => {
               const methodName = "reaction.hasUserReacted";
               span.setAttributes({
                  "query.user.id": options.userId,
                  "query.message.id": options.messageId,
                  "query.channel.id": options.channelId,
                  "query.emoji_key": options.emojiKey,
               });

               try {
                  assertId(methodName, options.messageId, options.userId, options.channelId);

                  const exists = await prisma.reaction.exists({
                     channelId: BigInt(options.channelId),
                     messageId: BigInt(options.messageId),
                     userId: BigInt(options.userId),
                     emojiKey: options.emojiKey,
                  });

                  return exists;
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async createOrIncrement(options: { userId: Snowflake; messageId: Snowflake; channelId: Snowflake; emojiKey: string }) {
            return analytics.startActiveSpan("db.reaction.createOrIncrement", async (span) => {
               const methodName = "reaction.createOrIncrement";
               span.setAttributes({
                  "query.user.id": options.userId,
                  "query.message.id": options.messageId,
                  "query.channel.id": options.channelId,
                  "query.emoji_key": options.emojiKey,
               });

               try {
                  assertId(methodName, options.userId, options.messageId, options.channelId);

                  const [reaction, aggregate] = await prisma.$transaction([
                     prisma.reaction.create({
                        data: {
                           messageId: BigInt(options.messageId),
                           userId: BigInt(options.userId),
                           channelId: BigInt(options.channelId),
                           emojiKey: options.emojiKey,
                        },
                     }),
                     prisma.reactionAggregate.upsert({
                        where: { messageId_emojiKey: { messageId: BigInt(options.messageId), emojiKey: options.emojiKey } },
                        create: { messageId: BigInt(options.messageId), emojiKey: options.emojiKey, count: 1 },
                        update: { count: { increment: 1 } },
                     }),
                  ]);

                  assertObj(methodName, reaction, DBErrorType.NULL_REACTION);
                  assertObj(methodName, aggregate, DBErrorType.NULL_REACTION_AGGREGATE);

                  return idFix(aggregate);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [options.userId]);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [options.messageId]);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.channelId]);
                  throw e;
               }
            });
         },
         async decrementOrDelete(options: { userId: Snowflake; messageId: Snowflake; channelId: Snowflake; emojiKey: string }) {
            return analytics.startActiveSpan("db.reaction.decrementOrDelete", async (span) => {
               const methodName = "reaction.decrementOrDelete";
               span.setAttributes({
                  "query.user.id": options.userId,
                  "query.message.id": options.messageId,
                  "query.channel.id": options.channelId,
                  "query.emoji_key": options.emojiKey,
               });

               try {
                  assertId(methodName, options.userId, options.messageId, options.channelId);

                  const [reaction, aggregate] = await prisma.$transaction([
                     prisma.reaction.delete({
                        where: {
                           channelId_messageId_userId_emojiKey: {
                              channelId: BigInt(options.channelId),
                              messageId: BigInt(options.messageId),
                              userId: BigInt(options.userId),
                              emojiKey: options.emojiKey,
                           },
                        },
                     }),
                     prisma.reactionAggregate.update({
                        where: { messageId_emojiKey: { messageId: BigInt(options.messageId), emojiKey: options.emojiKey } },
                        data: { count: { decrement: 1 } },
                     }),
                  ]);

                  if (aggregate.count <= 0) {
                     await prisma.reactionAggregate.delete({
                        where: { messageId_emojiKey: { messageId: BigInt(options.messageId), emojiKey: options.emojiKey } },
                     });
                     span.setAttribute("reaction_aggregate.deleted", true);
                  }

                  assertObj(methodName, reaction, DBErrorType.NULL_REACTION);
                  assertObj(methodName, aggregate, DBErrorType.NULL_REACTION_AGGREGATE);
                  return idFix(aggregate);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [options.userId]);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [options.messageId]);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_REACTION, [
                     { channelId: options.channelId, messageId: options.messageId, userId: options.userId, emojiKey: options.emojiKey },
                  ]);
                  await assertExists(e, methodName, DBErrorType.NULL_REACTION_AGGREGATE, [{ messageId: options.messageId, emojiKey: options.emojiKey }]);
                  throw e;
               }
            });
         },
      },
      reactionAggregate: {},
   },
});
