import { S3Client } from "@aws-sdk/client-s3";
import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { Client, LogLevel } from "@notionhq/client";
import { cleanEnv, port, str } from "envalid";
import * as firebase from "firebase-admin/app";
import { NotionConverter } from "notion-to-md";
import { Octokit } from "octokit";
import { Resend } from "resend";

export const env = cleanEnv(process.env, {
   CDN_LOCAL_URL: str(),
   CDN_PUBLIC_URL: str({ default: undefined }),
   SERVER_HOST: str(),
   SERVER_PORT: port(),
   GITHUB_TOKEN: str(),
   REPO_OWNER: str({ default: "WerdoxDev" }),
   REPO: str({ default: "Huginn" }),
   AWS_REGION: str(),
   AWS_KEY_ID: str(),
   AWS_SECRET_KEY: str(),
   AWS_BUCKET: str(),
   AWS_VERSIONS_OBJECT_KEY: str(),
   CERTIFICATE_PATH: str({ default: undefined }),
   PRIVATE_KEY_PATH: str({ default: undefined }),
   GOOGLE_CLIENT_ID: str(),
   GOOGLE_CLIENT_SECRET: str(),
   SESSION_PASSWORD: str(),
   ALLOWED_ORIGINS: str(),
   CDN_HMAC_SECRET: str(),
   IGDB_CLIENT_ID: str(),
   IGDB_CLIENT_SECRET: str(),
   OTLP_TRACE_URL: str(),
   OTLP_LOG_URL: str(),
   POSTHOG_HOST: str(),
   POSTHOG_KEY: str(),
   RESEND_API_KEY: str(),
   NOTION_TOKEN: str(),
   OTEL_SERVICE_NAME: str(),
   FIREBASE_PROJECT_ID: str(),
   FIREBASE_CLIENT_EMAIL: str(),
   FIREBASE_PRIVATE_KEY: str(),
});

initAnalytics(
   new RuntimeAnalytics(env.POSTHOG_KEY, {
      serviceName: env.OTEL_SERVICE_NAME,
      otlpTraceUrl: env.OTLP_TRACE_URL,
      otlpLogUrl: env.OTLP_LOG_URL,
      posthogHost: env.POSTHOG_HOST,
   }),
);

const { startCronJobs } = await import("#cron-jobs");
const { ServerGateway } = await import("#gateway/server-gateway");

export const CERT_FILE = env.CERTIFICATE_PATH && Bun.file(env.CERTIFICATE_PATH);
export const KEY_FILE = env.PRIVATE_KEY_PATH && Bun.file(env.PRIVATE_KEY_PATH);

export const gateway = new ServerGateway();
export const octokit: Octokit = new Octokit({ auth: env.GITHUB_TOKEN });

export const s3 = new S3Client({
   region: env.AWS_REGION,
   credentials: { accessKeyId: env.AWS_KEY_ID, secretAccessKey: env.AWS_SECRET_KEY },
});

export const resend = new Resend(env.RESEND_API_KEY);

export const notion = new Client({ auth: env.NOTION_TOKEN, notionVersion: "2026-03-11", logLevel: process.env.LOG_LEVEL as LogLevel });

export const n2m = new NotionConverter(notion);

firebase.initializeApp({
   credential: firebase.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
   }),
});

await startCronJobs();

await import("./index");
