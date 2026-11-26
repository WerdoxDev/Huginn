import { context, metrics, propagation, ROOT_CONTEXT, trace, type Span } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { AggregationTemporalityPreference, OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes, type Resource } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { PostHog } from "posthog-node";

import { Analytics, logLevelToSeverityNumber, type LogLevel } from "#analytics";

export type RuntimeAnalyticsOptions = { posthogHost?: string; serviceName: string; clientId?: string };

type Instrumentation = { shutdown: () => Promise<void> };
type SetupRuntimeInstrumentation = (options: {
   resource: Resource;
   logRecordProcessors: BatchLogRecordProcessor[];
   spanProcessors: BatchSpanProcessor[];
   metricReaders: PeriodicExportingMetricReader[];
}) => Instrumentation;

export class RuntimeAnalyticsBase extends Analytics {
   private readonly client: PostHog;
   private readonly options: RuntimeAnalyticsOptions;
   private readonly instrumentation: Instrumentation;
   private readonly logRecordProcessors: BatchLogRecordProcessor[];
   private readonly spanProcessors: BatchSpanProcessor[];
   private readonly metricReaders: PeriodicExportingMetricReader[];

   protected constructor(posthogApiKey: string, options: RuntimeAnalyticsOptions, setupInstrumentation: SetupRuntimeInstrumentation) {
      super();
      this.options = options;
      const posthogHost = (options.posthogHost ?? "https://eu.i.posthog.com").replace(/\/+$/, "");
      this.client = new PostHog(posthogApiKey, { host: posthogHost });

      this.logRecordProcessors = [
         new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
               url: `${posthogHost}/i/v1/logs`,
               headers: {
                  Authorization: `Bearer ${posthogApiKey}`,
               },
            }),
         }),
      ];
      this.spanProcessors = [
         new BatchSpanProcessor(
            new OTLPTraceExporter({
               url: `${posthogHost}/i/v1/traces`,
               headers: {
                  Authorization: `Bearer ${posthogApiKey}`,
               },
            }),
         ),
      ];
      this.metricReaders = [
         new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
               url: `${posthogHost}/i/v1/metrics`,
               headers: { Authorization: `Bearer ${posthogApiKey}` },
               temporalityPreference: AggregationTemporalityPreference.DELTA,
            }),
            exportIntervalMillis: 15000,
         }),
      ];
      this.instrumentation = setupInstrumentation({
         resource: resourceFromAttributes({ "service.name": options.serviceName, "client.id": options.clientId }),
         logRecordProcessors: this.logRecordProcessors,
         spanProcessors: this.spanProcessors,
         metricReaders: this.metricReaders,
      });
   }

   startActiveSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>;
   startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
   startActiveSpan<T>(name: string, fn: (span: Span) => T | Promise<T>): T | Promise<T> {
      const tracer = trace.getTracer(this.options.serviceName);

      return tracer.startActiveSpan(name, { attributes: { ...this.defaultAttributes } }, (span: Span) => {
         let result: T | Promise<T>;

         try {
            result = fn(span);
         } catch (error) {
            span.end();
            throw error;
         }

         if (result instanceof Promise) {
            return result.then(
               (value) => {
                  span.end();
                  return value;
               },
               (error) => {
                  span.end();
                  throw error;
               },
            );
         }

         span.end();
         return result;
      });
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

   public log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; exception?: unknown }): void {
      const logger = logs.getLogger(this.options.serviceName);

      const mergedAttributes = { ...this.defaultAttributes, ...options.attributes };
      logger.emit({
         severityNumber: logLevelToSeverityNumber(options.level),
         severityText: options.level.toUpperCase(),
         exception: options.exception,
         body: options.body,
         attributes: mergedAttributes,
      });

      if (options.level === "error" || options.level === "fatal") {
         console.error(`[${options.level.toUpperCase()}] ${options.body}`, mergedAttributes, options.exception);
      } else if (options.level === "warn") {
         console.warn(`[${options.level.toUpperCase()}] ${options.body}`, mergedAttributes);
      } else {
         console.log(`[${options.level.toUpperCase()}] ${options.body}`, mergedAttributes);
      }
   }

   public reset(): void {
      throw new Error("reset() is not supported in RuntimeAnalytics");
   }

   public getTraceparent(): string | undefined {
      const carrier: { traceparent?: string } = {};
      propagation.inject(context.active(), carrier);
      return carrier.traceparent;
   }

   public async flush(): Promise<void> {
      await Promise.all([
         this.client.flush(),
         ...this.logRecordProcessors.map((processor) => processor.forceFlush()),
         ...this.spanProcessors.map((processor) => processor.forceFlush()),
         ...this.metricReaders.map((reader) => reader.forceFlush()),
      ]);
   }

   public async shutdown(): Promise<void> {
      try {
         await Promise.all([this.client.shutdown(), this.instrumentation.shutdown()]);
      } finally {
         logs.disable();
         metrics.disable();
         trace.disable();
         context.disable();
         propagation.disable();
      }
   }
}
