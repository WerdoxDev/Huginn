import { readEnv } from "@huginn/runtime-shared";
import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import pathe from "pathe";

import type { Storage } from "#storage/storage";

export const envs = readEnv([
   "CDN_HOST",
   "CDN_PORT",
   "CERTIFICATE_PATH",
   "PRIVATE_KEY_PATH",
   "PASSPHRASE",
   "AWS_REGION",
   "AWS_KEY_ID",
   "AWS_SECRET_KEY",
   "AWS_BUCKET",
   { key: "UPLOADS_DIR", default: pathe.resolve(import.meta.dir, "../uploads") },
   { key: "CACHE_DIR", default: pathe.resolve(import.meta.dir, "../cache") },
   "CDN_HMAC_SECRET",
   "OTEL_SERVICE_NAME",
   "OTLP_TRACE_URL",
   "OTLP_LOG_URL",
   "POSTHOG_HOST",
   "POSTHOG_KEY",
] as const);

initAnalytics(
   new RuntimeAnalytics(envs.POSTHOG_KEY!, {
      serviceName: envs.OTEL_SERVICE_NAME!,
      otlpTraceUrl: envs.OTLP_TRACE_URL,
      otlpLogUrl: envs.OTLP_LOG_URL,
      posthogHost: envs.POSTHOG_HOST,
   }),
);

const { FileStorage } = await import("#storage/file-storage");
const { S3Storage } = await import("#storage/s3-storage");

export const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
export const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);

export const AWS_AVAILABLE = !!envs.AWS_SECRET_KEY && !!envs.AWS_KEY_ID && !!envs.AWS_BUCKET && !!envs.AWS_REGION;
export const storage: Storage = AWS_AVAILABLE ? new S3Storage() : new FileStorage(envs.UPLOADS_DIR);
export const cacheStorage: Storage = new FileStorage(envs.CACHE_DIR);

await import("./index");
