import { Prisma, PrismaClient } from "@prisma/client";
import authExtention from "./database-auth";
import userExtention from "./database-user";
import channelExtention from "./database-channel";
import messagesExtention from "./database-message";
import relationshipExtention from "./database-relationship";

export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
   model: {
      $allModels: {
         async exists<T>(this: T, where: Prisma.Args<T, "findFirst">["where"]) {
            const context = Prisma.getExtensionContext(this);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export * from "./database-error";
