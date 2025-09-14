import { S3Client } from "@aws-sdk/client-s3";
import { readEnv } from "@huginn/backend-shared";
import consola from "consola";
import { Octokit } from "octokit";
import { ServerGateway } from "#gateway/server-gateway";
import { enableLogs } from "@huginn/shared";

// enableLogs({ "server:gateway": ["recv"] })
enableLogs({ "server:gateway": ["default", "detail-identify"], "server:presence-manager": ["default", "detail"] });

export const envs = readEnv([
   "CDN_LOCAL_URL",
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
   "ALLOWED_ORIGINS",
   "REDIRECT_HOST",
   "CDN_HMAC_SECRET",
   { key: "FFMPEG_TEMP_DIR", default: "./ffmpeg" },
   "IGDB_CLIENT_ID",
   "IGDB_CLIENT_SECRET",
] as const);

export const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
export const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);

export const gateway = new ServerGateway();
export const octokit: Octokit = new Octokit({ auth: envs.GITHUB_TOKEN });
export const s3 = new S3Client({
   region: envs.AWS_REGION,
   credentials: { accessKeyId: envs.AWS_KEY_ID ?? "", secretAccessKey: envs.AWS_SECRET_KEY ?? "" },
});
