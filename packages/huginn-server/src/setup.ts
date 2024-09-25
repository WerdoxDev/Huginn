import consola from "consola";

const CONNECTION_STRING = process.env.POSTGRESQL_URL;

export const CDN_ROOT = process.env.CDN_ROOT;
export const SERVER_HOST = process.env.SERVER_HOST;
export const SERVER_PORT = process.env.SERVER_PORT;

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const REPO_OWNER = "WerdoxDev";
export const REPO = "Huginn";

export const AWS_REGION = process.env.AWS_REGION;
export const AWS_KEY_ID = process.env.AWS_KEY_ID;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
export const AWS_BUCKET = process.env.AWS_BUCKET;
export const AWS_VERSIONS_OBJECT_KEY = process.env.AWS_VERSIONS_OBJECT_KEY;

export const CERT_FILE = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const KEY_FILE = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

if (!CONNECTION_STRING) {
	consola.error("Database config is not set correctly!");
	process.exit();
}

// if (!serverHost || !serverPort) {
//    consola.error("Server config is not set correctly!");
//    process.exit();
// }
