import { Prisma, PrismaClient } from "../../generated/client/deno/edge.ts";
import authExtention from "./auth.ts";
import channelExtention from "./channel.ts";
import messagesExtention from "./message.ts";
import relationshipExtention from "./relationship.ts";
import userExtention from "./user.ts";

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
	.$extends(relationshipExtention);

export * from "./error.ts";
