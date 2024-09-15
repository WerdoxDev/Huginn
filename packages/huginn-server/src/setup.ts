import consola from "consola";

const CONNECTION_STRING = process.env.POSTGRESQL_URL;
export const CDN_ROOT = process.env.CDN_ROOT;
export const SERVER_HOST = process.env.SERVER_HOST;
export const SERVER_PORT = process.env.SERVER_PORT;
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const CERT_FILE = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const KEY_FILE = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);
export const REPO_OWNER = "WerdoxDev";
export const REPO = "Huginn";

if (!CONNECTION_STRING) {
   consola.error("Database config is not set correctly!");
   process.exit();
}

// if (!serverHost || !serverPort) {
//    consola.error("Server config is not set correctly!");
//    process.exit();
// }
