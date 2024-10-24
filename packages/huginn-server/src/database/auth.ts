import { type APIPostLoginJSONBody, type APIPostRegisterJSONBody, UserFlags, WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { DBErrorType, assertObj, prisma } from ".";

const authExtention = Prisma.defineExtension({
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
				});

				assertObj("findByCredentials", user, DBErrorType.NULL_USER);
				return user as Required<Prisma.UserGetPayload<{ include: never; select: never }>>;
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
				});

				assertObj("registerNew", newUser, DBErrorType.NULL_USER);
				return newUser;
			},
		},
	},
});

export default authExtention;
