import { context, ROOT_CONTEXT, trace, type Span } from "@opentelemetry/api";
import posthog, { type CaptureResult } from "posthog-js";

import type { LogLevel } from "./analytics";

import { Analytics } from "./analytics";
import { setupWebInstrumentation } from "./web-instrumentation";

type Options = {
   posthogHost: string;
   otlpHost: string;
   serviceName: string;
   serviceVersion?: string;
   environment?: string;
   clientId?: string;
};

export class WebAnalytics extends Analytics {
   private readonly options: Options;

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
         { serviceName: options.serviceName, url: options.otlpHost, serviceVersion: options.serviceVersion, clientId: options.clientId },
         (span) => {
            span.setAttribute("distinct.id", posthog.get_distinct_id());
         },
      );
   }

   public log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; traceId?: string }): void {
      const mergedAttributes = { ...this.defaultAttributes, ...options.attributes };
      posthog.captureLog({ body: options.body, level: options.level, attributes: mergedAttributes, trace_id: options.traceId });
   }

   public identify(id: string, properties?: Record<string, any>): void {
      posthog.identify(id, properties);
   }

   startActiveSpan<F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F> {
      const tracer = trace.getTracer(this.options.serviceName);
      return tracer.startActiveSpan(name, { attributes: { ...this.defaultAttributes, "distinct.id": posthog.get_distinct_id() } }, fn);
   }

   withRootContext<F extends () => ReturnType<F>>(fn: F): ReturnType<F> {
      return context.with(ROOT_CONTEXT, fn);
   }

   getActiveSpan(): Span | undefined {
      return trace.getActiveSpan();
   }

   public reset(): void {
      posthog.reset(true);
   }
}
