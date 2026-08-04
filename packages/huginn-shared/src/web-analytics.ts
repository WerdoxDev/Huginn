import { context, propagation, ROOT_CONTEXT, trace, type Span, type Tracer } from "@opentelemetry/api";
import { logs, type Logger } from "@opentelemetry/api-logs";
import posthog, { type CaptureResult } from "posthog-js";

import type { LogLevel } from "./analytics";

import { Analytics, logLevelToSeverityNumber } from "./analytics";
import { setupWebInstrumentation } from "./web-instrumentation";

const PRIVATE_POSTHOG_PERSON_PROPERTIES: readonly string[] = ["username", "displayName", "display_name", "email", "$name", "$email"];

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
         mask_all_element_attributes: false,
         mask_all_text: false,
         enable_recording_console_log: true,
         session_recording: {
            // Keep replay useful for layout and interaction debugging without
            // sending user-generated text, media, or input attributes.
            maskAllInputs: true,
            blockSelector: 'img, picture, video, audio, canvas, input, textarea, select, a[href], [contenteditable="true"]',

            // Explicit client-side false values take precedence over remote
            // session replay settings.
            recordHeaders: false,
            recordBody: false,
            captureCanvas: { recordCanvas: false },
            // maskCapturedNetworkRequestFn: () => null,
         },
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
            otlpTraceUrl: options.otlpTraceUrl,
            otlpLogUrl: options.otlpLogUrl,
            posthogHost: options.posthogHost,
            posthogApiKey: posthogApiKey,
            serviceVersion: options.serviceVersion,
            clientId: options.clientId,
         },
         (span) => {
            span.setAttribute("distinct_id", posthog.get_distinct_id());
         },
      );

      this.tracer = trace.getTracer(options.serviceName, options.serviceVersion);
      this.logger = logs.getLogger(options.serviceName, options.serviceVersion);
   }

   public log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; traceId?: string; exception?: unknown }): void {
      const mergedAttributes = { ...this.defaultAttributes, ...options.attributes };
      this.logger.emit({
         body: options.body,
         severityNumber: logLevelToSeverityNumber(options.level),
         severityText: options.level.toUpperCase(),
         attributes: {
            ...mergedAttributes,
            distinct_id: posthog.get_distinct_id(),
         },
         exception: options.exception,
      });

      if (options.level === "error" || options.level === "fatal") {
         console.error(`[${options.level.toUpperCase()}] ${options.body}`, mergedAttributes, options.exception);
      } else if (options.level === "warn") {
         console.warn(`[${options.level.toUpperCase()}] ${options.body}`, mergedAttributes);
      } else {
         console.log(`[${options.level.toUpperCase()}] ${options.body}`, mergedAttributes);
      }
   }

   public identify(id: string, properties?: Record<string, any>): void {
      const privateProperties = new Set(PRIVATE_POSTHOG_PERSON_PROPERTIES);
      const safeProperties = Object.fromEntries(Object.entries(properties ?? {}).filter(([key]) => !privateProperties.has(key)));

      posthog.identify(id, safeProperties);
      posthog.unsetPersonProperties([...PRIVATE_POSTHOG_PERSON_PROPERTIES]);
   }

   startActiveSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>;
   startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
   startActiveSpan<T>(name: string, fn: (span: Span) => T | Promise<T>): T | Promise<T> {
      return this.tracer.startActiveSpan(name, { attributes: { ...this.defaultAttributes, distinct_id: posthog.get_distinct_id() } }, (span: Span) => {
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
