import "dotenv/config";
import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(process.env, {
   VOICE_HOST: str(),
   VOICE_PORT: port(),
   MEDIA_LISTEN_INFOS: str(),
   CLOUDFLARE_TURN_ID: str({ default: undefined }),
   CLOUDFLARE_TURN_TOKEN: str({ default: undefined }),
   OTEL_SERVICE_NAME: str(),
   OTLP_TRACE_URL: str(),
   OTLP_LOG_URL: str(),
   POSTHOG_HOST: str(),
   POSTHOG_KEY: str(),
});
