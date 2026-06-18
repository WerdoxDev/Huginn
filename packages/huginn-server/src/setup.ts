import { S3Client } from "@aws-sdk/client-s3";
import { readEnv } from "@huginn/runtime-shared";
import { loggerOld } from "@huginn/shared";
import { Client } from "@notionhq/client";
import {} from "firebase-admin";
import * as firebase from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { NotionConverter } from "notion-to-md";
import { Octokit } from "octokit";
import { Resend } from "resend";

import { startCronJobs } from "#cron-jobs";
import { ServerGateway } from "#gateway/server-gateway";

// logger.enableLogs({ "server:gateway": ["default", "detail-identify"], "server:presence-manager": ["default", "detail"] });
loggerOld.enableLogs({ "backend-shared:websocket": ["default"], "server:cron": ["default"] });

export const envs = readEnv([
   "CDN_LOCAL_URL",
   "CDN_PUBLIC_URL",
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
   "SIGNOZ_API_URL",
   "RESEND_API_KEY",
   "NOTION_TOKEN",
   "OTEL_SERVICE_NAME",
   "FIREBASE_PROJECT_ID",
   "FIREBASE_CLIENT_EMAIL",
   "FIREBASE_PRIVATE_KEY",
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

export const notion = new Client({ auth: envs.NOTION_TOKEN, notionVersion: "2026-03-11" });

export const n2m = new NotionConverter(notion);

firebase.initializeApp({
   credential: firebase.cert({
      projectId: envs.FIREBASE_PROJECT_ID,
      clientEmail: envs.FIREBASE_CLIENT_EMAIL,
      privateKey: envs.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
   }),
});

await startCronJobs();
