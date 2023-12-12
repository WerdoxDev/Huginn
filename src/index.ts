import { Database } from "./database";
import consola from "consola";
import { startListening } from "./commands";
import { version } from "../package.json";

const connectionString = process.env.MONGODB_CONNECTION_STRING;
const dbName = process.env.MONGODB_DB_NAME;
export const serverHost = process.env.SERVER_HOST;
export const serverPort = process.env.SERVER_PORT;

async function main() {
   if (!connectionString || !dbName) {
      consola.error("Database config is not set correctly!");
      return;
   }

   if (!serverHost || !serverPort) {
      consola.error("Server config is not set correctly!");
      return;
   }

   consola.info(`Using version ${version}`);
   consola.start("Connecting to database...");

   await Database.initialize(connectionString, dbName);
   await import("./server.ts");
}

await main();

await startListening();
