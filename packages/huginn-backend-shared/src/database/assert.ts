import { DBErrorType } from "@huginn/backend-shared/types";
import type { Snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertCondition, assertId, prisma } from "#database";

export const assertExtension = Prisma.defineExtension({
	model: {
		user: {
			async assertUsersExist(methodName: string, userIds: Snowflake[]) {
				assertId(methodName, ...userIds);
				const foundCount = await prisma.user.count({ where: { id: { in: userIds.map((x) => BigInt(x)) } } });
				assertCondition(methodName, foundCount !== userIds.length, DBErrorType.NULL_USER, userIds.join(","));
			},
		},
		channel: {
			async assertChannelsExist(methodName: string, channelIds: Snowflake[]) {
				assertId(methodName, ...channelIds);
				const foundCount = await prisma.channel.count({ where: { id: { in: channelIds.map((x) => BigInt(x)) } } });
				assertCondition(methodName, foundCount !== channelIds.length, DBErrorType.NULL_CHANNEL, channelIds.join(","));
			},
		},
		relationship: {
			async assertRelationshipsExist(methodName: string, relationshipIds: Snowflake[]) {
				assertId(methodName, ...relationshipIds);
				const foundCount = await prisma.relationship.count({ where: { id: { in: relationshipIds.map((x) => BigInt(x)) } } });
				assertCondition(methodName, foundCount !== relationshipIds.length, DBErrorType.NULL_RELATIONSHIP, relationshipIds.join(","));
			},
		},
		message: {
			async assertMessagesExist(methodName: string, messageIds: Snowflake[]) {
				assertId(methodName, ...messageIds);
				const foundCount = await prisma.message.count({ where: { id: { in: messageIds.map((x) => BigInt(x)) } } });
				assertCondition(methodName, foundCount !== messageIds.length, DBErrorType.NULL_MESSAGE, messageIds.join(","));
			},
		},
		readState: {
			async assertReadStatesExist(methodName: string, idPairs: { userId: Snowflake; channelId: Snowflake }[]) {
				assertId(methodName, ...idPairs.flatMap((x) => [x.userId, x.channelId]));
				const foundCount = await prisma.readState.count({
					where: { channelId: { in: idPairs.map((x) => BigInt(x.channelId)) }, userId: { in: idPairs.map((x) => BigInt(x.userId)) } },
				});
				assertCondition(
					methodName,
					foundCount !== idPairs.length,
					DBErrorType.NULL_READ_STATE,
					idPairs.map((x) => `${x.userId}:${x.channelId}`).join(","),
				);
			},
		},
	},
});
