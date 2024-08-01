import consola from "consola";
// import { version } from "../package.json";
import { startListening } from "./commands";
import { startServer } from "./server";
import { handle } from "hono/vercel";
import { Hono } from "hono";

const connectionString = process.env.MONGODB_CONNECTION_STRING;
export const cdnRoot = process.env.CDN_ROOT;
export const serverHost = process.env.SERVER_HOST;
export const serverPort = process.env.SERVER_PORT;
export const certFile = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const keyFile = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

if (!connectionString) {
   consola.error("Database config is not set correctly!");
   process.exit();
}

if (!serverHost || !serverPort) {
   consola.error("Server config is not set correctly!");
   process.exit();
}

// consola.info(`Using version ${version}`);

// await startListening();

// const server = startServer();

const app = new Hono().basePath("/api");

app.get("/", c => {
   return c.json({
      message: "Hello Hono!",
   });
});

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const OPTIONS = handler;

// export default handle(app);
