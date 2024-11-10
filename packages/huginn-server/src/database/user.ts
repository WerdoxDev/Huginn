import type { APIPatchCurrentUserJSONBody } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { DBErrorType, assertCondition, assertId, assertObj, prisma } from ".";
import type { UserInclude, UserPayload, UserSelect } from "./common";

const userExtention = Prisma.defineExtension({
	model: {
		user: {
			async getById<Include extends UserInclude, Select extends UserSelect>(id: Snowflake, include?: Include, select?: Select) {
				assertId("getById", id);
				const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, include: include, select: select });

				assertObj("getById", user, DBErrorType.NULL_USER, id);
				return user as UserPayload<Include, Select>;
			},
			async getByUsername<Include extends UserInclude>(username: string, include?: Include) {
				const user = await prisma.user.findUnique({ where: { username: username }, include: include });

				assertObj("getByUsername", user, DBErrorType.NULL_USER, username);
				return user as UserPayload<Include>;
			},
			async edit<Include extends UserInclude, Select extends UserSelect>(
				id: Snowflake,
				editedUser: APIPatchCurrentUserJSONBody,
				include?: Include,
				select?: Select,
			) {
				assertId("edit", id);
				const updatedUser = await prisma.user.update({ where: { id: BigInt(id) }, data: { ...editedUser }, include: include, select: select });

				assertObj("edit", updatedUser, DBErrorType.NULL_USER, id);
				return updatedUser as UserPayload<Include, Select>;
			},
			async assertUserExists(methodName: string, id: Snowflake) {
				assertId(methodName, id);
				const userExists = await prisma.user.exists({ id: BigInt(id) });
				assertCondition(methodName, !userExists, DBErrorType.NULL_USER, id);
			},
			async hasChannel(userId: Snowflake, channelId: Snowflake) {
				assertId("hasChannel", userId, channelId);

				const hasAccess = await prisma.user.exists({
					id: BigInt(userId),
					OR: [{ includedChannels: { some: { id: BigInt(channelId) } } }, { ownedChannels: { some: { id: BigInt(channelId) } } }],
				});

				return hasAccess;
			},
		},
	},
});

export default userExtention;
