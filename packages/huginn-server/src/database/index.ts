import { Prisma, PrismaClient } from "@prisma/client";
import authExtention from "./auth";
import channelExtention from "./channel";
import messagesExtention from "./message";
import readStateExtention from "./readState";
import relationshipExtention from "./relationship";
import userExtention from "./user";

// export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
export const prismaBase = new PrismaClient().$extends({
	model: {
		$allModels: {
			async exists<T>(this: T, where: Prisma.Args<T, "findFirst">["where"]) {
				const context = Prisma.getExtensionContext(this);

				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const result = await (context as any).findFirst({ where });
				return result !== null;
			},
		},
	},
});

export const prisma = prismaBase
	.$extends(authExtention)
	.$extends(userExtention)
	.$extends(channelExtention)
	.$extends(messagesExtention)
	.$extends(relationshipExtention)
	.$extends(readStateExtention);

export * from "./error";
