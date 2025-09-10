import { DBErrorType } from "@huginn/backend-shared/types";
import { type BigIntToString, idFix, type Snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import consola from "consola";
import { assertExists, assertId, assertObj, prisma, type ReadStatePayload } from "#database";

export const readStateExtension = Prisma.defineExtension({
   model: {
      readState: {
         async getByUserAndChannelId(userId: Snowflake, channelId: Snowflake) {
            const methodName = "readState.getByUserAndChannelId";
            assertId(methodName, userId, channelId);

            const readState = await prisma.readState.findUnique({
               where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
            });

            assertObj(methodName, readState, DBErrorType.NULL_READ_STATE, `${userId}:${channelId}`);
            return idFix(readState) as ReadStatePayload<undefined>;
         },
         async getUserStates(userId: Snowflake) {
            const methodName = "readState.getUserStates";
            assertId(methodName, userId);

            const readStates = await prisma.readState.findMany({ where: { userId: BigInt(userId) } });
            assertObj(methodName, readStates, DBErrorType.NULL_READ_STATE);

            return idFix(readStates);
         },
         async createState(userId: Snowflake, channelId: Snowflake) {
            const methodName = "readState.createState";
            try {
               assertId(methodName, userId, channelId);

               const existing = await prisma.readState.findUnique({
                  where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
               });

               if (existing) {
                  return existing;
               }

               const readState = await prisma.readState.create({ data: { userId: BigInt(userId), channelId: BigInt(channelId) } });
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
                  where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
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
               if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                  consola.info("Rare error due to fast updates, ignoring");
                  return;
               }
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [lastReadMessageId]);
               await assertExists(e, methodName, DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
               throw e;
            }
         },
         async countUnreadMessages(userId: Snowflake, channelId: Snowflake) {
            const readState = await prisma.readState.getByUserAndChannelId(userId, channelId);

            const potentialUnreadMessages = await prisma.message.findMany({
               where: { channelId: BigInt(channelId) },
               skip: 1,
               cursor: readState.lastReadMessageId ? { id: BigInt(readState.lastReadMessageId) } : undefined,
               select: { id: true, authorId: true },
            });

            const unreadCount = potentialUnreadMessages.filter((x) => x.authorId !== BigInt(userId)).length;

            return unreadCount < 0 ? 0 : unreadCount;
         },
      },
   },
});
