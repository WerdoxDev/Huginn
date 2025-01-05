import { Prisma, PrismaClient } from "@prisma/client";
import { withOptimize } from "@prisma/extension-optimize";
import { envs } from "#setup";
import assertExtension from "./assert";
import authExtension from "./auth";
import channelExtension from "./channel";
import embedExtension from "./embed";
import messagesExtension from "./message";
import readStateExtension from "./readState";
import relationshipExtension from "./relationship";
import userExtension from "./user";

// export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
export const prismaBase = new PrismaClient().$extends(withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY ?? "", enable: false }));

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
	.$extends(assertExtension)
	.$extends(authExtension)
	.$extends(userExtension)
	.$extends(channelExtension)
	.$extends(messagesExtension)
	.$extends(relationshipExtension)
	.$extends(readStateExtension)
	.$extends(embedExtension);

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
