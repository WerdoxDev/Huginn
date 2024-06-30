import { Prisma, PrismaClient } from "@prisma/client";
import authExtention from "./auth";
import userExtention from "./user";
import channelExtention from "./channel";
import messagesExtention from "./message";
import relationshipExtention from "./relationship";

// export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
export const prismaBase = new PrismaClient().$extends({
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

export * from "./error";
