import { S3Client } from "@aws-sdk/client-s3";
import { readEnv } from "@huginn/runtime-shared";
import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { Client, LogLevel } from "@notionhq/client";
import * as firebase from "firebase-admin/app";
import { NotionConverter } from "notion-to-md";
import { Octokit } from "octokit";
import { Resend } from "resend";

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
   "OTLP_TRACE_URL",
   "OTLP_LOG_URL",
   "POSTHOG_HOST",
   "POSTHOG_KEY",
   "RESEND_API_KEY",
   "NOTION_TOKEN",
   "OTEL_SERVICE_NAME",
   "FIREBASE_PROJECT_ID",
   "FIREBASE_CLIENT_EMAIL",
   "FIREBASE_PRIVATE_KEY",
] as const);

initAnalytics(
   new RuntimeAnalytics(envs.POSTHOG_KEY!, {
      serviceName: envs.OTEL_SERVICE_NAME!,
      otlpTraceUrl: envs.OTLP_TRACE_URL,
      otlpLogUrl: envs.OTLP_LOG_URL,
      posthogHost: envs.POSTHOG_HOST,
   }),
);

const { startCronJobs } = await import("#cron-jobs");
const { ServerGateway } = await import("#gateway/server-gateway");

export const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
export const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);

export const gateway = new ServerGateway();
export const octokit: Octokit = new Octokit({ auth: envs.GITHUB_TOKEN });

export const s3 = new S3Client({
   region: envs.AWS_REGION,
   credentials: { accessKeyId: envs.AWS_KEY_ID ?? "", secretAccessKey: envs.AWS_SECRET_KEY ?? "" },
});

export const resend = new Resend(envs.RESEND_API_KEY);

export const notion = new Client({ auth: envs.NOTION_TOKEN, notionVersion: "2026-03-11", logLevel: process.env.LOG_LEVEL as LogLevel });

export const n2m = new NotionConverter(notion);

firebase.initializeApp({
   credential: firebase.cert({
      projectId: envs.FIREBASE_PROJECT_ID,
      clientEmail: envs.FIREBASE_CLIENT_EMAIL,
      privateKey: envs.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
   }),
});

await startCronJobs();

await import("./index");
