// import { User } from "./database/schemas/user-schema";

export async function startListening() {
   for await (const line of console) {
      if (line === "clear") {
         console.clear();
         console.log("\n\nCleared!\n\n");
      }
   }
}
