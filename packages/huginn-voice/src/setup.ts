import { initAnalytics } from "@huginnjs/shared";
import { RuntimeAnalytics } from "@huginnjs/shared/runtime-analytics";

import { env } from "#env";

initAnalytics(
   new RuntimeAnalytics(env.POSTHOG_KEY, {
      serviceName: env.OTEL_SERVICE_NAME,
      otlpTraceUrl: env.OTLP_TRACE_URL,
      otlpLogUrl: env.OTLP_LOG_URL,
      posthogHost: env.POSTHOG_HOST,
   }),
);

await import("./index.ts");
