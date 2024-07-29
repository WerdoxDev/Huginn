import consola from "consola";
import { version } from "../package.json";
import { startListening } from "./commands";

const connectionString = process.env.MONGODB_CONNECTION_STRING;
export const serverHost = process.env.SERVER_HOST;
export const serverPort = process.env.SERVER_PORT;
export const certFile = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const keyFile = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

async function main() {
   if (!connectionString) {
      consola.error("Database config is not set correctly!");
      return;
   }

   if (!serverHost || !serverPort) {
      consola.error("Server config is not set correctly!");
      return;
   }

   consola.info(`Using version ${version}`);

   await import("./server");
}

await main();

await startListening();
