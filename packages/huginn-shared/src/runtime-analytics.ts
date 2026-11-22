import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { RuntimeAnalyticsBase, type RuntimeAnalyticsOptions } from "./runtime-analytics-base";

export class RuntimeAnalytics extends RuntimeAnalyticsBase {
   public constructor(posthogApiKey: string, options: RuntimeAnalyticsOptions) {
      super(posthogApiKey, options, (config) => {
         const pinoInstrumentation = new PinoInstrumentation();
         const sdk = new NodeSDK({ ...config, instrumentations: [pinoInstrumentation] });
         sdk.start();

         return {
            shutdown: async () => {
               pinoInstrumentation.disable();
               await sdk.shutdown();
            },
         };
      });
   }
}
