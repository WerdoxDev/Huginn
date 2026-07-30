import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { cleanEnv, port, str } from "envalid";

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
   KLIPY_KEY: str(),
});

initAnalytics(
   new RuntimeAnalytics(env.POSTHOG_KEY, {
      serviceName: env.OTEL_SERVICE_NAME,
      otlpTraceUrl: env.OTLP_TRACE_URL,
      otlpLogUrl: env.OTLP_LOG_URL,
      posthogHost: env.POSTHOG_HOST,
   }),
);
