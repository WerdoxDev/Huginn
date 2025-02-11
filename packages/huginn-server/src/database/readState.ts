import { DBErrorType } from "@huginn/backend-shared/types";
import { type Snowflake, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import consola from "consola";
import { assertExists, assertId, assertObj, prisma } from "#database";

export const readStateExtension = Prisma.defineExtension({
	model: {
		readState: {
			async getByUserAndChannelId(userId: Snowflake, channelId: Snowflake) {
				assertId("getByUserAndChannelId", userId, channelId);

				const readState = await prisma.readState.findUnique({
					where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
				});

				assertObj("getByUserAndChannelId", readState, DBErrorType.NULL_READ_STATE, `${userId}:${channelId}`);
				return readState as Prisma.ReadStateGetPayload<undefined>;
			},
			async getUserStates(userId: Snowflake) {
				assertId("getUserStates", userId);

				const readStates = await prisma.readState.findMany({ where: { userId: BigInt(userId) } });
				assertObj("getUserStates", readStates, DBErrorType.NULL_READ_STATE);

				return readStates;
			},
			async createState(userId: Snowflake, channelId: Snowflake) {
				try {
					const existing = await prisma.readState.findUnique({
						where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
					});

					if (existing) {
						return existing;
					}

					const readState = await prisma.readState.create({ data: { userId: BigInt(userId), channelId: BigInt(channelId) } });
					assertObj("createState", readState, DBErrorType.NULL_READ_STATE);

					return readState;
				} catch (e) {
					await assertExists(e, "createState", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "createState", DBErrorType.NULL_USER, [userId]);
					throw e;
				}
			},
			async deleteState(userId: Snowflake, channelId: Snowflake) {
				try {
					const deletedReadState = await prisma.readState.delete({
						where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
					});

					assertObj("deleteState", deletedReadState, DBErrorType.NULL_READ_STATE);
					return deletedReadState;
				} catch (e) {
					await assertExists(e, "createState", DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
					throw e;
				}
			},
			async updateLastRead(userId: Snowflake, channelId: Snowflake, lastReadMessageId: Snowflake) {
				try {
					const olderExists = await prisma.readState.exists({
						userId: BigInt(userId),
						channelId: BigInt(channelId),
						OR: [{ lastReadMessage: null }, { lastReadMessage: { timestamp: { lt: new Date(snowflake.getTimestamp(lastReadMessageId)) } } }],
					});

					if (!olderExists) {
						return;
					}

					const updatedReadState = await prisma.readState.update({
						where: {
							channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) },
							OR: [{ lastReadMessage: null }, { lastReadMessage: { timestamp: { lt: new Date(snowflake.getTimestamp(lastReadMessageId)) } } }],
						},
						data: { lastReadMessage: { connect: { id: BigInt(lastReadMessageId) } } },
					});

					assertObj("updateLastReadMessage", updatedReadState, DBErrorType.NULL_READ_STATE);

					return updatedReadState;
				} catch (e) {
					if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
						consola.info("Rare error due to fast updates, ignoring");
						return;
					}
					await assertExists(e, "updateLastReadMessage", DBErrorType.NULL_MESSAGE, [lastReadMessageId]);
					await assertExists(e, "updateLastReadMessage", DBErrorType.NULL_READ_STATE, [{ userId, channelId }]);
					throw e;
				}
			},
			async countUnreadMessages(userId: Snowflake, channelId: Snowflake) {
				const readState = await prisma.readState.getByUserAndChannelId(userId, channelId);

				const unreadCount =
					(await prisma.message.count({
						where: { channelId: BigInt(channelId), author: { id: { not: BigInt(userId) } } },
						cursor: readState.lastReadMessageId ? { id: BigInt(readState.lastReadMessageId) } : undefined,
					})) - 1;

				return unreadCount < 0 ? 0 : unreadCount;
			},
		},
	},
});
