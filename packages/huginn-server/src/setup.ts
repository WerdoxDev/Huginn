import { readEnv } from "@huginn/backend-shared";
import consola from "consola";

export const envs = readEnv([
	"POSTGRESQL_URL",
	"CDN_ROOT",
	"SERVER_HOST",
	"SERVER_PORT",
	"GITHUB_TOKEN",
	{ key: "REPO_OWNER", default: "WerdoxDev" },
	{ key: "REPO", default: "Huginn" },
	"AWS_REGION",
	"AWS_KEY_ID",
	"AWS_SECRET_KEY",
	"AWS_BUCKET",
	"AWS_VERSIONS_OBJECT_KEY",
	"PASSPHRASE",
	"CERTIFICATE_PATH",
	"PRIVATE_KEY_PATH",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"SESSION_PASSWORD",
] as const);

export const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
export const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);

if (!envs.POSTGRESQL_URL) {
	consola.error("Database config is not set correctly!");
	process.exit();
}

// if (!serverHost || !serverPort) {
//    consola.error("Server config is not set correctly!");
//    process.exit();
// }
