import { metrics } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { LoggerProvider } from "@opentelemetry/sdk-logs";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

import { RuntimeAnalyticsBase, type RuntimeAnalyticsOptions } from "./runtime-analytics-base";

// Electron uses HTTP exporters without NodeSDK's gRPC/protobuf exporters,
// resource detection, or Pino instrumentation.
export class ElectronAnalytics extends RuntimeAnalyticsBase {
   public constructor(posthogApiKey: string, options: RuntimeAnalyticsOptions) {
      super(posthogApiKey, options, ({ resource, logRecordProcessors, spanProcessors, metricReaders }) => {
         const loggerProvider = new LoggerProvider({ resource, processors: logRecordProcessors });
         const tracerProvider = new NodeTracerProvider({ resource, spanProcessors });
         const meterProvider = new MeterProvider({ resource, readers: metricReaders });
         logs.setGlobalLoggerProvider(loggerProvider);
         metrics.setGlobalMeterProvider(meterProvider);
         tracerProvider.register();

         return {
            shutdown: async () => {
               await Promise.all([loggerProvider.shutdown(), tracerProvider.shutdown(), meterProvider.shutdown()]);
            },
         };
      });
   }
}
