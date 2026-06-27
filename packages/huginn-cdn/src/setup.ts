import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { cleanEnv, port, str } from "envalid";
import pathe from "pathe";

import type { Storage } from "#storage/storage";

export const env = cleanEnv(process.env, {
   CDN_HOST: str(),
   CDN_PORT: port(),
   CERTIFICATE_PATH: str({ default: undefined }),
   PRIVATE_KEY_PATH: str({ default: undefined }),
   AWS_REGION: str(),
   AWS_KEY_ID: str(),
   AWS_SECRET_KEY: str(),
   AWS_BUCKET: str(),
   CDN_HMAC_SECRET: str(),
   OTEL_SERVICE_NAME: str(),
   OTLP_TRACE_URL: str(),
   OTLP_LOG_URL: str(),
   POSTHOG_HOST: str(),
   POSTHOG_KEY: str(),
   UPLOADS_DIR: str({ default: pathe.resolve(import.meta.dir, "../uploads") }),
   CACHE_DIR: str({ default: pathe.resolve(import.meta.dir, "../cache") }),
});

initAnalytics(
   new RuntimeAnalytics(env.POSTHOG_KEY, {
      serviceName: env.OTEL_SERVICE_NAME,
      otlpTraceUrl: env.OTLP_TRACE_URL,
      otlpLogUrl: env.OTLP_LOG_URL,
      posthogHost: env.POSTHOG_HOST,
   }),
);

const { FileStorage } = await import("#storage/file-storage");
const { S3Storage } = await import("#storage/s3-storage");

export const CERT_FILE = env.CERTIFICATE_PATH && Bun.file(env.CERTIFICATE_PATH);
export const KEY_FILE = env.PRIVATE_KEY_PATH && Bun.file(env.PRIVATE_KEY_PATH);

export const AWS_AVAILABLE = !!env.AWS_SECRET_KEY && !!env.AWS_KEY_ID && !!env.AWS_BUCKET && !!env.AWS_REGION;
export const storage: Storage = AWS_AVAILABLE ? new S3Storage() : new FileStorage(env.UPLOADS_DIR);
export const cacheStorage: Storage = new FileStorage(env.CACHE_DIR);

await import("./index");
