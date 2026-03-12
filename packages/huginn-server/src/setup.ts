import { startCronJobs } from "#cron-jobs";
import { ServerGateway } from "#gateway/server-gateway";
import { S3Client } from "@aws-sdk/client-s3";
import { readEnv } from "@huginn/runtime-shared";
import { logger } from "@huginn/shared";
import { Octokit } from "octokit";
import { Resend } from "resend";

// logger.enableLogs({ "server:gateway": ["default", "detail-identify"], "server:presence-manager": ["default", "detail"] });
logger.enableLogs({ "backend-shared:websocket": ["default"] });

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
   "CDN_HMAC_SECRET",
   "IGDB_CLIENT_ID",
   "IGDB_CLIENT_SECRET",
   "AXIOM_TOKEN",
   "AXIOM_DATASET",
   "RESEND_API_KEY",
] as const);

export const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
export const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);

export const gateway = new ServerGateway();
export const octokit: Octokit = new Octokit({ auth: envs.GITHUB_TOKEN });
export const s3 = new S3Client({
   region: envs.AWS_REGION,
   credentials: { accessKeyId: envs.AWS_KEY_ID ?? "", secretAccessKey: envs.AWS_SECRET_KEY ?? "" },
});
export const resend = new Resend(envs.RESEND_API_KEY);

startCronJobs();
