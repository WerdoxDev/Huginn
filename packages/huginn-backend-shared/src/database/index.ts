import { Prisma, PrismaClient, type Message, type EmailVerification } from "#prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { assertExtension } from "./assert";
import { attachmentExtension } from "./attachment";
import { channelExtension } from "./channel";
import { emailVerificationExtension } from "./emailVerification";
import { embedExtension } from "./embed";
import { knownApplicationExtension } from "./knownApplication";
import { messagesExtension } from "./message";
import { messagePinExtension } from "./messagePin";
import { readStateExtension } from "./readState";
import { relationshipExtension } from "./relationship";
import { settingsExtension } from "./settings";
import { userExtension } from "./user";

// export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
const adapter = new PrismaPg({ connectionString: process.env.POSTGRESQL_URL });
// export const prismaBase = new PrismaClient({ adapter }).$extends(withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY ?? "", enable: false }));
export const prismaBase = new PrismaClient({ adapter });

export const prisma = prismaBase
   .$extends({
      model: {
         $allModels: {
            async exists<T>(this: T, where: Prisma.Args<T, "findFirst">["where"]) {
               const context = Prisma.getExtensionContext(this);

               const result = await (context as any).count({ where });
               return result !== 0;
            },
         },
      },
   })
   .$extends(assertExtension)
   .$extends(userExtension)
   .$extends(channelExtension)
   .$extends(messagesExtension)
   .$extends(messagePinExtension)
   .$extends(relationshipExtension)
   .$extends(readStateExtension)
   .$extends(embedExtension)
   .$extends(attachmentExtension)
   .$extends(settingsExtension)
   .$extends(knownApplicationExtension)
   .$extends(emailVerificationExtension);

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
export * from "./common";
export { Prisma, type Message, type EmailVerification };
