import consola from "consola";

const CONNECTION_STRING = Deno.env.get("POSTGRESQL_URL");

export const CDN_ROOT = Deno.env.get("CDN_ROOT");
export const SERVER_HOST = Deno.env.get("SERVER_HOST");
export const SERVER_PORT = Number(Deno.env.get("SERVER_PORT"));

export const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
export const REPO_OWNER = "WerdoxDev";
export const REPO = "Huginn";

export const AWS_REGION = Deno.env.get("AWS_REGION");
export const AWS_KEY_ID = Deno.env.get("AWS_KEY_ID");
export const AWS_SECRET_KEY = Deno.env.get("AWS_SECRET_KEY");
export const AWS_BUCKET = Deno.env.get("AWS_BUCKET");
export const AWS_VERSIONS_OBJECT_KEY = Deno.env.get("AWS_VERSIONS_OBJECT_KEY");

export const CERT_FILE_PATH = Deno.env.get("CERT_FILE_PATH");
export const KEY_FILE_PATH = Deno.env.get("KEY_FILE_PATH");

if (!CONNECTION_STRING) {
	consola.error("Database config is not set correctly!");
	Deno.exit();
}

// if (!serverHost || !serverPort) {
//    consola.error("Server config is not set correctly!");
//    process.exit();
// }
