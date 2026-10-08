import { INVALID_SPAN_CONTEXT, SpanStatusCode, trace, type Span } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";

export type LogLevel = "info" | "warn" | "error" | "debug" | "fatal" | "trace";

export abstract class Analytics {
   public defaultAttributes: Record<string, any> = {};

   public setDefaultAttributes(attributes: Record<string, any>): void {
      this.defaultAttributes = attributes;
   }

   abstract log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; exception?: unknown }): void;
   abstract identify(id: string, properties?: Record<string, any>): void;
   abstract reset(): void;
   abstract flush(): Promise<void>;
   abstract shutdown(): Promise<void>;
   // abstract startActiveSpan<F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F> | Promise<ReturnType<F>>;
   abstract startActiveSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>;
   abstract startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
   abstract startActiveSpan<T>(name: string, fn: (span: Span) => T | Promise<T>): T | Promise<T>;
   abstract getActiveSpan(): Span | undefined;
   abstract withRootContext<F extends () => ReturnType<F>>(fn: F): ReturnType<F>;
   abstract getTraceparent(): string | undefined;
}

class AnalyticsShim extends Analytics {
   log() {}
   identify() {}
   reset() {}
   async flush() {}
   async shutdown() {}
   startActiveSpan(_name: string, fn: (span: Span) => any) {
      return fn(trace.wrapSpanContext(INVALID_SPAN_CONTEXT));
   }
   withTry(span: Span, fn: (span: Span) => any) {
      return fn(span);
   }
   getActiveSpan() {
      return undefined;
   }
   withRootContext<F extends () => ReturnType<F>>(fn: F): ReturnType<F> {
      return fn();
   }
   getTraceparent() {
      return undefined;
   }
}

export const analyticsShim: Analytics = new AnalyticsShim();

let impl: Analytics;
let lifecycle = Promise.resolve();

export function initAnalytics(instance: Analytics): void {
   impl = instance;
}

export function reinitializeAnalytics(createInstance: () => Analytics): Promise<void> {
   const reinitialize = lifecycle
      .catch(() => {})
      .then(async () => {
         const previous = impl;
         const defaultAttributes = previous?.defaultAttributes ?? {};
         impl = analyticsShim;

         if (previous && previous !== analyticsShim) {
            try {
               await previous.flush();
            } catch (error) {
               console.error("Failed to flush analytics before reinitializing", error);
            }

            try {
               await previous.shutdown();
            } catch (error) {
               console.error("Failed to shut down analytics before reinitializing", error);
            }
         }

         const next = createInstance();
         next.setDefaultAttributes(defaultAttributes);
         impl = next;
      });

   lifecycle = reinitialize;
   return reinitialize;
}

export const analytics: Analytics = new Proxy({} as Analytics, {
   get(_, prop) {
      if (!impl) return analyticsShim[prop as keyof Analytics];
      const value = impl[prop as keyof Analytics];
      return typeof value === "function" ? value.bind(impl) : value;
   },
});

export function recordSpanError(error: unknown, providedAnalytics: Analytics = analytics): void {
   const span = providedAnalytics.getActiveSpan();
   span?.recordException(error as Error);
   span?.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
}

export function logLevelToSeverityNumber(level: LogLevel): SeverityNumber {
   switch (level) {
      case "trace":
         return SeverityNumber.TRACE;
      case "debug":
         return SeverityNumber.DEBUG;
      case "info":
         return SeverityNumber.INFO;
      case "warn":
         return SeverityNumber.WARN;
      case "error":
         return SeverityNumber.ERROR;
      case "fatal":
         return SeverityNumber.FATAL;
   }
}

export { SpanStatusCode };
