import { context, propagation, ROOT_CONTEXT, trace, type Span, type Tracer } from "@opentelemetry/api";
import { logs, type Logger } from "@opentelemetry/api-logs";
import posthog, { type CaptureResult } from "posthog-js";

import type { LogLevel } from "./analytics";

import { Analytics, logLevelToSeverityNumber } from "./analytics";
import { setupWebInstrumentation } from "./web-instrumentation";

type Options = {
   posthogHost: string;
   otlpTraceUrl: string;
   otlpLogUrl: string;
   serviceName: string;
   serviceVersion?: string;
   environment?: string;
   clientId?: string;
};

export class WebAnalytics extends Analytics {
   private readonly options: Options;
   private tracer: Tracer;
   private logger: Logger;

   public constructor(posthogApiKey: string, options: Options) {
      super();
      this.options = options;
      posthog.init(posthogApiKey, {
         api_host: options.posthogHost,
         ui_host: "https://eu.posthog.com",
         defaults: "2026-01-30",
         capture_exceptions: true,
         logs: {
            serviceName: "app-web",
            environment: options.environment,
            serviceVersion: options.serviceVersion,
            resourceAttributes: options.clientId ? { "device.id": options.clientId } : undefined,
         },
         // capture_pageview: !__IS_ELECTRON__,
         // bootstrap: { distinctID: options.clientId },

         before_send: (event: CaptureResult | null): CaptureResult | null => {
            if (event?.properties?.$current_url) {
               // parse the URL
               const parsed = new URL(event.properties.$current_url);

               // if there is a hash in the URL, we want to include it in the $pathname property
               if (parsed.hash) {
                  event.properties.$pathname = parsed.pathname + parsed.hash;
               }
            }
            return event;
         },
         capture_performance: true,
         error_tracking: { captureExtensionExceptions: true },
      });

      setupWebInstrumentation(
         {
            serviceName: options.serviceName,
            traceUrl: options.otlpTraceUrl,
            logUrl: options.otlpLogUrl,
            serviceVersion: options.serviceVersion,
            clientId: options.clientId,
         },
         (span) => {
            span.setAttribute("distinct.id", posthog.get_distinct_id());
         },
      );

      this.tracer = trace.getTracer(options.serviceName, options.serviceVersion);
      this.logger = logs.getLogger(options.serviceName, options.serviceVersion);
   }

   public log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; traceId?: string; exception: unknown }): void {
      const mergedAttributes = { ...this.defaultAttributes, ...options.attributes };
      posthog.captureLog({ body: options.body, level: options.level, attributes: mergedAttributes, trace_id: options.traceId });
      this.logger.emit({
         body: options.body,
         severityNumber: logLevelToSeverityNumber(options.level),
         severityText: options.level.toUpperCase(),
         attributes: {
            ...mergedAttributes,
            "distinct.id": posthog.get_distinct_id(),
         },
         exception: options.exception,
      });
   }

   public identify(id: string, properties?: Record<string, any>): void {
      posthog.identify(id, properties);
   }

   startActiveSpan<F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F> {
      return this.tracer.startActiveSpan(name, { attributes: { ...this.defaultAttributes, "distinct.id": posthog.get_distinct_id() } }, fn);
   }

   withRootContext<F extends () => ReturnType<F>>(fn: F): ReturnType<F> {
      return context.with(ROOT_CONTEXT, fn);
   }

   getActiveSpan(): Span | undefined {
      return trace.getActiveSpan();
   }

   getTraceparent(): string | undefined {
      const carrier: { traceparent?: string } = {};
      propagation.inject(context.active(), carrier);
      return carrier.traceparent;
   }

   public reset(): void {
      posthog.reset(true);
   }
}
