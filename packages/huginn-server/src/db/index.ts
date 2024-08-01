import { Prisma, PrismaClient } from "@prisma/client/edge";
import authExtention from "./auth";
import userExtention from "./user";
import channelExtention from "./channel";
import messagesExtention from "./message";
import relationshipExtention from "./relationship";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "node:process";
import { hconsole } from "@/log-utils";
import { withAccelerate } from "@prisma/extension-accelerate";

const connectionString =
   "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiODljZmZlOWQtNzg3Yy00ODMyLWFmZjMtMzk2YjRlMmQyNzI5IiwidGVuYW50X2lkIjoiN2MyN2QyYWJhMmNlYjFmZGJhZmE2MjVlNmY2YTUxMjJjZGI0N2VhZTY1NWVjODgxMDgxYjFlYzg4NjYyNTI4MyIsImludGVybmFsX3NlY3JldCI6ImVmNDM5MDFiLTliNTctNDlkNC05NzlmLTI3ZTcxMzI1ZTIzYSJ9.9-uKEJ2rKCiiLGZzIJJj7RqZZlXGwbzAWlFO1G_x1TA";

if (!connectionString) {
   hconsole.error("Database config is not set correctly!");
   // process.exit();
}

// const pool = new Pool({ connectionString });
// const adapter = new PrismaPg(pool);

// export const prismaBase = new PrismaClient({ omit: { user: { password: true } } }).$extends({
export const prismaBase = new PrismaClient({
   datasourceUrl:
      "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiODljZmZlOWQtNzg3Yy00ODMyLWFmZjMtMzk2YjRlMmQyNzI5IiwidGVuYW50X2lkIjoiN2MyN2QyYWJhMmNlYjFmZGJhZmE2MjVlNmY2YTUxMjJjZGI0N2VhZTY1NWVjODgxMDgxYjFlYzg4NjYyNTI4MyIsImludGVybmFsX3NlY3JldCI6ImVmNDM5MDFiLTliNTctNDlkNC05NzlmLTI3ZTcxMzI1ZTIzYSJ9.9-uKEJ2rKCiiLGZzIJJj7RqZZlXGwbzAWlFO1G_x1TA",
})
   .$extends(withAccelerate())
   .$extends({
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
