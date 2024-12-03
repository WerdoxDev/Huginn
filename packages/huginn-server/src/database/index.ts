import { Prisma, PrismaClient } from "@prisma/client";
import assertExtention from "./assert";
import authExtention from "./auth";
import channelExtention from "./channel";
import messagesExtention from "./message";
import readStateExtention from "./readState";
import relationshipExtention from "./relationship";
import userExtention from "./user";

// export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
export const prismaBase = new PrismaClient();

export const prisma = prismaBase
	.$extends({
		model: {
			$allModels: {
				async exists<T>(this: T, where: Prisma.Args<T, "findFirst">["where"]) {
					const context = Prisma.getExtensionContext(this);

					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const result = await (context as any).count({ where });
					return result !== 0;
				},
			},
		},
	})
	.$extends(assertExtention)
	.$extends(authExtention)
	.$extends(userExtention)
	.$extends(channelExtention)
	.$extends(messagesExtention)
	.$extends(relationshipExtention)
	.$extends(readStateExtention);

// let longest = 0;
// prismaBase.$on("query", (e) => {
// 	if (e.duration > longest) {
// 		console.log(`Duration: ${e.duration}ms, Query: ${e.query}, ${e.params}`);
// 		longest = e.duration;
// 	}
// 	// console.log(`Query: ${e.query}`);
// 	// console.log(`Params: ${e.params}`);
// 	// console.log(`Duration: ${e.duration}ms`);
// });

export * from "./error";
