import { context, propagation, ROOT_CONTEXT, trace, type Span } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { PostHog } from "posthog-node";

import { Analytics, logLevelToSeverityNumber, type LogLevel } from "#analytics";

type Options = { posthogHost?: string; otlpTraceUrl?: string; otlpLogUrl?: string; serviceName: string; clientId?: string };

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
            new BatchLogRecordProcessor({
               exporter: new OTLPLogExporter({
                  url: options.otlpLogUrl,
               }),
            }),
            new BatchLogRecordProcessor({
               exporter: new OTLPLogExporter({
                  url: `${options.posthogHost}/i/v1/logs`,
                  headers: {
                     Authorization: `Bearer ${posthogApiKey}`,
                  },
               }),
            }),
            // new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
         ],
         spanProcessors: [
            new BatchSpanProcessor(
               new OTLPTraceExporter({
                  url: options.otlpTraceUrl,
               }),
            ),
            new BatchSpanProcessor(
               new OTLPTraceExporter({
                  url: `${options.posthogHost}/i/v1/traces`,
                  headers: {
                     Authorization: `Bearer ${posthogApiKey}`,
                  },
               }),
            ),
         ],
         instrumentations: [new PinoInstrumentation()],
      });

      sdk.start();
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
}
