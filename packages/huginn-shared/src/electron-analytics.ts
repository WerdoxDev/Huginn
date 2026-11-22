import { logs } from "@opentelemetry/api-logs";
import { LoggerProvider } from "@opentelemetry/sdk-logs";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

import { RuntimeAnalyticsBase, type RuntimeAnalyticsOptions } from "./runtime-analytics-base";

// Electron only needs the configured HTTP exporters, without NodeSDK's optional
// metrics, gRPC/protobuf exporters, resource detection, or Pino instrumentation.
export class ElectronAnalytics extends RuntimeAnalyticsBase {
   public constructor(posthogApiKey: string, options: RuntimeAnalyticsOptions) {
      super(posthogApiKey, options, ({ resource, logRecordProcessors, spanProcessors }) => {
         const loggerProvider = new LoggerProvider({ resource, processors: logRecordProcessors });
         const tracerProvider = new NodeTracerProvider({ resource, spanProcessors });
         logs.setGlobalLoggerProvider(loggerProvider);
         tracerProvider.register();

         return {
            shutdown: async () => {
               await Promise.all([loggerProvider.shutdown(), tracerProvider.shutdown()]);
            },
         };
      });
   }
}
