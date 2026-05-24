import { assertExists, assertId, assertObj, prisma, type ReadStatePayload, Prisma } from "#database";
import { PrismaClientKnownRequestError } from "#prisma/internal/prismaNamespace";
import { DBErrorType } from "#types";
import { idFix, type APIReadStateWithoutUser, type Snowflake } from "@huginn/shared";
import consola from "consola";

export const readStateExtension = Prisma.defineExtension({
   model: {
      readState: {
         async getByUserAndChannelId(userId: Snowflake, channelId: Snowflake) {
            const methodName = "readState.getByUserAndChannelId";
            assertId(methodName, userId, channelId);

            const readState = await prisma.readState.findUnique({
               where: {
                  channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
               },
            });

            assertObj(methodName, readState, DBErrorType.NULL_READ_STATE, `${userId}:${channelId}`);
            return idFix(readState) as ReadStatePayload<undefined>;
         },
         async getUserStates(userId: Snowflake) {
            const methodName = "readState.getUserStates";
            assertId(methodName, userId);

            const readStates = await prisma.readState.findMany({
               where: { userId: BigInt(userId) },
            });
            assertObj(methodName, readStates, DBErrorType.NULL_READ_STATE);

            return idFix(readStates);
         },
         async createState(userId: Snowflake, channelId: Snowflake) {
            const methodName = "readState.createState";
            try {
               assertId(methodName, userId, channelId);

               const existing = await prisma.readState.findUnique({
                  where: {
                     channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                  },
               });

               if (existing) {
                  return existing;
               }

               const readState = await prisma.readState.create({
                  data: { userId: BigInt(userId), channelId: BigInt(channelId) },
               });
               assertObj(methodName, readState, DBErrorType.NULL_READ_STATE);

               return idFix(readState);
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
               throw e;
            }
         },
         async deleteState(userId: Snowflake, channelId: Snowflake) {
            const methodName = "readState.deleteState";
            try {
               assertId(methodName, userId, channelId);

               const deletedReadState = await prisma.readState.delete({
                  where: {
                     channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                  },
               });

               assertObj(methodName, deletedReadState, DBErrorType.NULL_READ_STATE);
               return idFix(deletedReadState);
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
               throw e;
            }
         },
         async updateLastRead(userId: Snowflake, channelId: Snowflake, lastReadMessageId: Snowflake) {
            const methodName = "readState.updateLastRead";
            try {
               assertId(methodName, userId, channelId, lastReadMessageId);

               const olderExists = await prisma.readState.exists({
                  userId: BigInt(userId),
                  channelId: BigInt(channelId),
                  OR: [{ lastReadMessage: null }, { lastReadMessage: { id: { lt: BigInt(lastReadMessageId) } } }],
               });

               if (!olderExists) {
                  return;
               }

               const updatedReadState = await prisma.readState.update({
                  where: {
                     channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
                     OR: [{ lastReadMessage: null }, { lastReadMessage: { id: { lt: BigInt(lastReadMessageId) } } }],
                  },
                  data: { lastReadMessage: { connect: { id: BigInt(lastReadMessageId) } } },
               });

               assertObj(methodName, updatedReadState, DBErrorType.NULL_READ_STATE);

               return idFix(updatedReadState);
            } catch (e) {
               // if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
               //    consola.info("Rare error due to fast updates, ignoring");
               //    return;
               // }
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [lastReadMessageId]);
               await assertExists(e, methodName, DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
               throw e;
            }
         },
         async countUnreadMessages(userId: Snowflake, channelId: Snowflake) {
            const readState = await prisma.readState.getByUserAndChannelId(userId, channelId);

            const potentialUnreadMessages = await prisma.message.findMany({
               where: { channelId: BigInt(channelId), deletedTimestamp: null },
               skip: 1,
               cursor: readState.lastReadMessageId ? { id: BigInt(readState.lastReadMessageId) } : undefined,
               select: { id: true, authorId: true },
            });

            const unreadCount = potentialUnreadMessages.filter((x) => x.authorId !== BigInt(userId)).length;

            return unreadCount < 0 ? 0 : unreadCount;
         },
         async getUserStatesWithUnreadCounts(userId: Snowflake): Promise<APIReadStateWithoutUser[]> {
            const methodName = "readState.getUserStatesWithUnreadCounts";
            assertId(methodName, userId);

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
                  AND m."deletedTimestamp" IS NULL
                  AND (rs."lastReadMessageId" IS NULL OR m."id" > rs."lastReadMessageId")
               WHERE rs."userId" = ${BigInt(userId)}
               GROUP BY rs."channelId", rs."lastReadMessageId"
            `;

            return result.map((x) => ({
               channelId: x.channelId.toString() as Snowflake,
               lastReadMessageId: (x.lastReadMessageId?.toString() ?? null) as Snowflake | null,
               unreadCount: Number(x.unreadCount),
            }));
         },
      },
   },
});
