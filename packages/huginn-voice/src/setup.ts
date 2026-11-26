import { initAnalytics } from "@huginnjs/shared";
import { RuntimeAnalytics } from "@huginnjs/shared/runtime-analytics";

import { env } from "#env";

initAnalytics(
   new RuntimeAnalytics(env.POSTHOG_KEY, {
      serviceName: env.OTEL_SERVICE_NAME,
      posthogHost: env.POSTHOG_HOST,
   }),
);
