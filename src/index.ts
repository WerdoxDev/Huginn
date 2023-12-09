import { startServer } from "./server.ts";
import { Database } from "./database";
import consola from "consola";
import { startListening } from "./commands";

async function main() {
   const connectionString = process.env.MONGODB_CONNECTION_STRING;
   const dbName = process.env.MONGODB_DB_NAME;
   const serverHost = process.env.SERVER_HOST;
   const serverPort = process.env.SERVER_PORT;

   if (!connectionString || !dbName) {
      consola.error("Database config is not set correctly!");
      return;
   }

   if (!serverHost || !serverPort) {
      consola.error("Server config is not set correctly!");
      return;
   }

   await Database.initialize(connectionString, dbName);
   startServer(serverHost, parseInt(serverPort, 10));
}

await main();

await startListening();
