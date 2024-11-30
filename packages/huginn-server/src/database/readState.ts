import { type Snowflake, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { DBErrorType, assertCondition, assertId, assertObj, prisma } from "#database";

const readStateExtention = Prisma.defineExtension({
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
				await prisma.user.assertUserExists("createState", userId);
				await prisma.channel.assertChannelExists("createState", channelId);

				const existing = await prisma.readState.findUnique({
					where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
				});

				if (existing) {
					return existing;
				}

				const readState = await prisma.readState.create({ data: { userId: BigInt(userId), channelId: BigInt(channelId) } });
				assertObj("createState", readState, DBErrorType.NULL_READ_STATE);

				return readState;
			},
			async deleteState(userId: Snowflake, channelId: Snowflake) {
				await prisma.readState.assertReadStateExists("deleteState", userId, channelId);

				const deletedReadState = await prisma.readState.delete({
					where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
				});

				assertObj("deleteState", deletedReadState, DBErrorType.NULL_READ_STATE);
				return deletedReadState;
			},
			async updateLastReadMessage(userId: Snowflake, channelId: Snowflake, lastReadMessageId: Snowflake) {
				await prisma.readState.assertReadStateExists("setLatestReadMessage", userId, channelId);
				await prisma.message.assertMessageExists("setLatestReadMessage", lastReadMessageId);

				const updatedReadState = await prisma.readState.update({
					where: { channelId_userId: { userId: BigInt(userId), channelId: BigInt(channelId) } },
					data: { lastReadMessage: { connect: { id: BigInt(lastReadMessageId) } } },
				});

				assertObj("updateLastReadMessage", updatedReadState, DBErrorType.NULL_READ_STATE);

				return updatedReadState;
			},
			async countUnreadMessages(userId: Snowflake, channelId: Snowflake) {
				const readState = await prisma.readState.getByUserAndChannelId(userId, channelId);

				const unreadCount = await prisma.message.count({
					where: { channelId: BigInt(channelId), author: { id: { not: BigInt(userId) } } },
					cursor: readState.lastReadMessageId ? { id: BigInt(readState.lastReadMessageId) } : undefined,
				});

				return unreadCount;
			},
			async assertReadStateExists(methodName: string, userId: Snowflake, channelId: Snowflake) {
				assertId(methodName, userId, channelId);
				const readStateExists = await prisma.readState.exists({ userId: BigInt(userId), channelId: BigInt(channelId) });
				assertCondition(methodName, !readStateExists, DBErrorType.NULL_READ_STATE, `${userId}:${channelId}`);
			},
		},
	},
});

export default readStateExtention;
