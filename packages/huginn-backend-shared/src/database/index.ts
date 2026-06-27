import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient, type Message, type EmailVerification } from "#prisma/client";

import { assertExtension } from "./assert.ts";
import { attachmentExtension } from "./attachment.ts";
import { channelExtension } from "./channel.ts";
import { emailVerificationExtension } from "./emailVerification.ts";
import { embedExtension } from "./embed.ts";
import { knownApplicationExtension } from "./knownApplication.ts";
import { messagesExtension } from "./message.ts";
import { messagePinExtension } from "./messagePin.ts";
import { notificationTokenExtension } from "./notificationToken.ts";
import { readStateExtension } from "./readState.ts";
import { relationshipExtension } from "./relationship.ts";
import { settingsExtension } from "./settings.ts";
import { userExtension } from "./user.ts";

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
   .$extends(emailVerificationExtension)
   .$extends(notificationTokenExtension);

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

export * from "./error.ts";
export * from "./common.ts";
export { Prisma, type Message, type EmailVerification };
