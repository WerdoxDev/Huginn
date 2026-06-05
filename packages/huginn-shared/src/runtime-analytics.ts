import { context, ROOT_CONTEXT, trace, type Span } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { PostHog } from "posthog-node";

import { Analytics, type LogLevel } from "#analytics";

type Options = { posthogHost?: string; otlpHost?: string; serviceName: string; clientId?: string };

export class RuntimeAnalytics extends Analytics {
   private readonly client: PostHog;
   private readonly options: Options;

   public constructor(posthogApiKey: string, options: Options) {
      super();
      this.options = options;
      this.client = new PostHog(posthogApiKey, { host: options.posthogHost ?? "https://eu.i.posthog.com" });

      const sdk = new NodeSDK({
         resource: resourceFromAttributes({ "service.name": options.serviceName, "client.id": options.clientId }),

         logRecordProcessors: [
            new BatchLogRecordProcessor(
               new OTLPLogExporter({
                  url: options.otlpHost,
                  headers: {
                     Authorization: `Bearer ${posthogApiKey}`,
                  },
               }),
            ),
         ],
         spanProcessors: [
            new BatchSpanProcessor(
               new OTLPTraceExporter({
                  url: options.otlpHost,
                  headers: {
                     Authorization: `Bearer ${posthogApiKey}`,
                  },
               }),
            ),
         ],
      });

      sdk.start();
   }

   startActiveSpan<F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F> {
      const tracer = trace.getTracer(this.options.serviceName);
      return tracer.startActiveSpan(name, { attributes: { ...this.defaultAttributes } }, fn);
   }

   getActiveSpan(): Span | undefined {
      return trace.getActiveSpan();
   }

   withRootContext<F extends () => ReturnType<F>>(fn: F): ReturnType<F> {
      return context.with(ROOT_CONTEXT, fn);
   }

   public identify(id: string, properties?: Record<string, any>): void {
      this.client.identify({ distinctId: id, properties });
   }

   public log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; traceId?: string }): void {
      const logger = logs.getLogger(this.options.serviceName);

      const mergedAttributes = { ...this.defaultAttributes, ...options.attributes };
      logger.emit({ severityText: options.level, body: options.body, attributes: mergedAttributes });
   }

   public reset(): void {
      throw new Error("reset() is not supported in RuntimeAnalytics");
   }
}
