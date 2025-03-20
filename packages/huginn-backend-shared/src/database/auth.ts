import { DBErrorType } from "@huginn/backend-shared/types";
import { type APIPostLoginJSONBody, type APIPostRegisterJSONBody, UserFlags, WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertObj, prisma } from ".";
import { selectPrivateUser } from "./common";

export const authExtension = Prisma.defineExtension({
	name: "auth",
	model: {
		user: {
			async findByCredentials(credentials: APIPostLoginJSONBody) {
				const user = await prisma.user.findFirst({
					where: {
						AND: [
							{ password: credentials.password },
							{
								OR: [{ email: credentials.email }, { username: credentials.username?.toLowerCase() }],
							},
						],
					},
					select: selectPrivateUser,
				});

				assertObj("findByCredentials", user, DBErrorType.NULL_USER);
				return user as NonNullable<typeof user>;
			},
			async registerNew(user: APIPostRegisterJSONBody) {
				const newUser = await prisma.user.create({
					data: {
						id: snowflake.generate(WorkerID.AUTH),
						username: user.username.toLowerCase(),
						displayName: !user.displayName ? null : user.displayName,
						password: user.password,
						avatar: null,
						email: user.email,
						flags: UserFlags.NONE,
						system: false,
					},
					select: selectPrivateUser,
				});

				assertObj("registerNew", newUser, DBErrorType.NULL_USER);
				return newUser;
			},
		},
	},
});
