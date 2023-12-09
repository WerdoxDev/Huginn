import { User } from "./database/user-schema";

export async function startListening() {
   for await (const line of console) {
      if (line.startsWith("del")) {
         const username = line.split(" ")[1];
         const result = await User.deleteOne({ username }).exec();
         console.log(`Result: ${result.deletedCount === 1}`);
      } else if (line === "clear") {
         console.clear();
         console.log("\n\nCleared!\n\n");
      }
   }
}
