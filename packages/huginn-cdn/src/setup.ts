import { initAnalytics } from "@huginnjs/shared";
import { RuntimeAnalytics } from "@huginnjs/shared/runtime-analytics";
import { cleanEnv, port, str } from "envalid";
import pathe from "pathe";

export const env = cleanEnv(process.env, {
   CDN_HOST: str(),
   CDN_PORT: port(),
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
