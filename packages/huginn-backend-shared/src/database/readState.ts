import { analytics, idFix, recordSpanError, type APIReadStateWithoutUser, type Snowflake } from "@huginn/shared";

import { assertExists, assertId, assertObj, prisma, type ReadStatePayload, Prisma } from "#database";
import { DBErrorType } from "#types";

export const readStateExtension = Prisma.defineExtension({
   model: {
      readState: {
         async getByUserAndChannelId(userId: Snowflake, channelId: Snowflake) {
            return analytics.startActiveSpan("db.readState.getByUserAndChannelId", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.channel.id": channelId });
               const methodName = "readState.getByUserAndChannelId";
               assertId(methodName, userId, channelId);

               try {
                  const readState = await prisma.readState.findUniqueOrThrow({
                     where: {
                        channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                     },
                  });

                  return idFix(readState) as ReadStatePayload<undefined>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async getUserStates(userId: Snowflake) {
            return analytics.startActiveSpan("db.readState.getUserStates", async (span) => {
               span.setAttribute("query.user.id", userId);
               const methodName = "readState.getUserStates";
               assertId(methodName, userId);

               try {
                  const readStates = await prisma.readState.findMany({
                     where: { userId: BigInt(userId) },
                  });

                  span.setAttribute("read_states.count", readStates.length);

                  return idFix(readStates);
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async createState(userId: Snowflake, channelId: Snowflake) {
            return analytics.startActiveSpan("db.readState.createState", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.channel.id": channelId });
               const methodName = "readState.createState";
               try {
                  assertId(methodName, userId, channelId);

                  const existing = await prisma.readState.findUnique({
                     where: {
                        channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                     },
                  });

                  span.setAttribute("read_state.existing", !!existing);

                  if (existing) return existing;

                  const readState = await prisma.readState.create({
                     data: { userId: BigInt(userId), channelId: BigInt(channelId) },
                  });

                  span.setAttribute("read_state.channel_id", readState.channelId.toString());
                  span.setAttribute("read_state.user_id", readState.userId.toString());

                  return idFix(readState);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async deleteState(userId: Snowflake, channelId: Snowflake) {
            return analytics.startActiveSpan("db.readState.deleteState", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.channel.id": channelId });
               const methodName = "readState.deleteState";
               try {
                  assertId(methodName, userId, channelId);

                  const deletedReadState = await prisma.readState.delete({
                     where: {
                        channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                     },
                  });

                  span.setAttribute("deleted_read_state.channel_id", deletedReadState.channelId.toString());
                  span.setAttribute("deleted_read_state.user_id", deletedReadState.userId.toString());

                  assertObj(methodName, deletedReadState, DBErrorType.NULL_READ_STATE);
                  return idFix(deletedReadState);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async updateLastRead(userId: Snowflake, channelId: Snowflake, lastReadMessageId: Snowflake) {
            return analytics.startActiveSpan("db.readState.updateLastRead", async (span) => {
               span.setAttributes({
                  "query.user.id": userId,
                  "query.channel.id": channelId,
                  "query.message.id": lastReadMessageId,
               });
               const methodName = "readState.updateLastRead";
               try {
                  assertId(methodName, userId, channelId, lastReadMessageId);

                  const olderExists = await prisma.readState.exists({
                     userId: BigInt(userId),
                     channelId: BigInt(channelId),
                     OR: [{ lastReadMessage: null }, { lastReadMessage: { id: { lt: BigInt(lastReadMessageId) } } }],
                  });

                  span.setAttribute("older_read_state.exists", olderExists);

                  if (!olderExists) return;

                  const updatedReadState = await prisma.readState.update({
                     where: {
                        channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                        OR: [{ lastReadMessage: null }, { lastReadMessage: { id: { lt: BigInt(lastReadMessageId) } } }],
                     },
                     data: { lastReadMessage: { connect: { id: BigInt(lastReadMessageId) } } },
                  });

                  span.setAttribute("updated_read_state.channel_id", updatedReadState.channelId.toString());
                  span.setAttribute("updated_read_state.user_id", updatedReadState.userId.toString());

                  assertObj(methodName, updatedReadState, DBErrorType.NULL_READ_STATE);

                  return idFix(updatedReadState);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [lastReadMessageId]);
                  await assertExists(e, methodName, DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async countUnreadMessages(userId: Snowflake, channelId: Snowflake) {
            return analytics.startActiveSpan("db.readState.countUnreadMessages", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.channel.id": channelId });
               try {
                  const readState = await prisma.readState.getByUserAndChannelId(userId, channelId);

                  span.setAttribute("read_state.last_read_message_id", readState.lastReadMessageId ?? "null");
                  const potentialUnreadMessages = await prisma.message.findMany({
                     where: { channelId: BigInt(channelId) },
                     skip: 1,
                     cursor: readState.lastReadMessageId ? { id: BigInt(readState.lastReadMessageId) } : undefined,
                     select: { id: true, authorId: true },
                  });

                  span.setAttribute("potential_unread_messages.count", potentialUnreadMessages.length);
                  const unreadCount = potentialUnreadMessages.filter((x) => x.authorId !== BigInt(userId)).length;

                  span.setAttribute("read_state.unread_count", unreadCount);
                  return unreadCount < 0 ? 0 : unreadCount;
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async getUserStatesWithUnreadCounts(userId: Snowflake): Promise<APIReadStateWithoutUser[]> {
            return analytics.startActiveSpan("db.readState.getUserStatesWithUnreadCounts", async (span) => {
               span.setAttribute("query.user.id", userId);
               const methodName = "readState.getUserStatesWithUnreadCounts";
               assertId(methodName, userId);

               try {
                  // Single aggregated query replacing the N+1 pattern (one countUnreadMessages per channel).
                  // COUNT returns bigint in PostgreSQL raw queries, so we convert to number.
                  const result = await prisma.$queryRaw<Array<{ channelId: bigint; lastReadMessageId: bigint | null; unreadCount: bigint }>>`
                     SELECT
                        rs."channelId",
                        rs."lastReadMessageId",
                        COUNT(m."id") AS "unreadCount"
                     FROM "ReadState" rs
                     LEFT JOIN "Message" m ON m."channelId" = rs."channelId"
                        AND m."authorId" != rs."userId"
                        AND (rs."lastReadMessageId" IS NULL OR m."id" > rs."lastReadMessageId")
                     WHERE rs."userId" = ${BigInt(userId)}
                     GROUP BY rs."channelId", rs."lastReadMessageId"
                  `;

                  span.setAttribute("read_states.count", result.length);

                  return result.map((x) => ({
                     channelId: x.channelId.toString() as Snowflake,
                     lastReadMessageId: (x.lastReadMessageId?.toString() ?? null) as Snowflake | null,
                     unreadCount: Number(x.unreadCount),
                  }));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
      },
   },
});
