import { SpanStatusCode, type Span } from "@opentelemetry/api";

export type LogLevel = "info" | "warn" | "error" | "debug" | "fatal" | "trace";

export abstract class Analytics {
   public defaultAttributes: Record<string, any> = {};

   public setDefaultAttributes(attributes: Record<string, any>): void {
      this.defaultAttributes = attributes;
   }

   abstract log(options: { body: string; level: LogLevel; attributes?: Record<string, any>; traceId?: string }): void;
   abstract identify(id: string, properties?: Record<string, any>): void;
   abstract reset(): void;
   abstract startActiveSpan<F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F>;
   abstract getActiveSpan(): Span | undefined;
}

class AnalyticsShim extends Analytics {
   log() {}
   identify() {}
   reset() {}
   startActiveSpan(_name: string, fn: (span: Span) => any) {
      const spanShim = {
         setAttribute: () => {},
         setAttributes: () => {},
         recordException: () => {},
         setStatus: () => {},
         end: () => {},
      };
      return fn(spanShim as unknown as Span);
   }
   getActiveSpan() {
      return undefined;
   }
}

export const analyticsShim: Analytics = new AnalyticsShim();

let impl: Analytics;

export function initAnalytics(instance: Analytics): void {
   impl = instance;
}

export const analytics: Analytics = new Proxy({} as Analytics, {
   get(_, prop) {
      if (!impl) throw new Error("Analytics not initialized");
      const value = impl[prop as keyof Analytics];
      return typeof value === "function" ? value.bind(impl) : value;
   },
});

export function recordSpanError(error: Error, providedAnalytics: Analytics = analytics): void {
   const span = providedAnalytics.getActiveSpan();
   span?.recordException(error);
   span?.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
}

export { SpanStatusCode };
