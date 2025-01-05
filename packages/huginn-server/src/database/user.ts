import type { APIPatchCurrentUserJSONBody } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { DBErrorType, assertId, assertObj, prisma } from ".";

const userExtension = Prisma.defineExtension({
	model: {
		user: {
			async getById<Args extends Prisma.UserDefaultArgs>(id: Snowflake, args?: Args) {
				assertId("getById", id);
				const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, ...args });

				assertObj("getById", user, DBErrorType.NULL_USER, id);
				return user as Prisma.UserGetPayload<Args>;
			},
			async getByUsername<Args extends Prisma.UserDefaultArgs>(username: string, args?: Args) {
				const user = await prisma.user.findUnique({ where: { username: username }, ...args });

				assertObj("getByUsername", user, DBErrorType.NULL_USER, username);
				return user as Prisma.UserGetPayload<Args>;
			},
			async edit<Args extends Prisma.UserDefaultArgs>(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody, args?: Args) {
				assertId("edit", id);
				const updatedUser = await prisma.user.update({ where: { id: BigInt(id) }, data: { ...editedUser }, ...args });

				assertObj("edit", updatedUser, DBErrorType.NULL_USER, id);
				return updatedUser as Prisma.UserGetPayload<Args>;
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

export default userExtension;
