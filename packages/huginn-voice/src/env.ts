import "dotenv/config";
import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(process.env, {
   VOICE_HOST: str(),
   VOICE_PORT: port(),
   MEDIA_LISTEN_INFOS: str(),
   OTEL_SERVICE_NAME: str(),
   OTLP_TRACE_URL: str(),
   OTLP_LOG_URL: str(),
   POSTHOG_HOST: str(),
   POSTHOG_KEY: str(),
});
