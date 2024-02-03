// import { User } from "./database/schemas/user-schema";

import { prisma } from "./database";

export async function startListening() {
   for await (const line of console) {
      if (line === "clear") {
         console.clear();
         console.log("\n\nCleared!\n\n");
      }
      if (line === "clear messages") {
         await prisma.message.deleteMany();
      }
   }
}
