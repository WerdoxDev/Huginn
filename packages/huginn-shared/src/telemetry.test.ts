import { context, ROOT_CONTEXT, trace } from "@opentelemetry/api";
import { InMemoryLogRecordExporter } from "@opentelemetry/sdk-logs";
import { InMemorySpanExporter } from "@opentelemetry/sdk-trace-base";
import { afterEach, expect, mock, test } from "bun:test";

const spanExporters: InMemorySpanExporter[] = [];
const logExporters: InMemoryLogRecordExporter[] = [];
const shutdownPosthog = mock(async () => {});

mock.module("@opentelemetry/exporter-trace-otlp-http", () => ({
   OTLPTraceExporter: class extends InMemorySpanExporter {
      constructor() {
         super();
         spanExporters.push(this);
      }
   },
}));
mock.module("@opentelemetry/exporter-logs-otlp-http", () => ({
   OTLPLogExporter: class extends InMemoryLogRecordExporter {
      constructor() {
         super();
         logExporters.push(this);
      }
   },
}));
mock.module("posthog-node", () => ({
   PostHog: class {
      flush = async () => {};
      shutdown = shutdownPosthog;
   },
}));

const originalPromise = globalThis.Promise;
const originalSetTimeout = globalThis.setTimeout;
const originalWindow = globalThis.window;
const originalXhr = globalThis.XMLHttpRequest;
const { setupWebInstrumentation } = await import("./web-instrumentation");
const { ElectronAnalytics } = await import("./electron-analytics");
const { RuntimeAnalytics } = await import("./runtime-analytics");

let shutdown: (() => Promise<void>) | undefined;

afterEach(async () => {
   await shutdown?.();
   shutdown = undefined;
   spanExporters.length = 0;
   logExporters.length = 0;
   shutdownPosthog.mockClear();
   globalThis.window = originalWindow;
   globalThis.XMLHttpRequest = originalXhr;
});

test("web tracing uses synchronous context without patching promises or timers", async () => {
   globalThis.window = {} as Window & typeof globalThis;
   globalThis.XMLHttpRequest = class {
      open() {}
      send() {}
      abort() {}
   } as unknown as typeof XMLHttpRequest;
   const instrumentation = setupWebInstrumentation(
      {
         serviceName: "test-web",
         otlpTraceUrl: "https://example.test/traces",
         otlpLogUrl: "https://example.test/logs",
         posthogHost: "https://example.test",
         posthogApiKey: "test-key",
      },
      () => {},
   );
   shutdown = instrumentation.shutdown;

   expect(globalThis.Promise).toBe(originalPromise);
   expect(globalThis.setTimeout).toBe(originalSetTimeout);
   expect("Zone" in globalThis).toBe(false);

   await trace.getTracer("test-web").startActiveSpan("web-span", async (span) => {
      expect(trace.getActiveSpan()).toBe(span);
      await Promise.resolve();
      expect(trace.getActiveSpan()).toBeUndefined();
      span.end();
   });
   await instrumentation.forceFlush();
   expect(spanExporters.map((exporter) => exporter.getFinishedSpans().map((span) => span.name))).toEqual([["web-span"], ["web-span"]]);
});

test.each([
   ["Electron", ElectronAnalytics],
   ["runtime", RuntimeAnalytics],
] as const)("%s exports spans and logs, shuts down, and can initialize again", async (_name, AnalyticsClass) => {
   for (let iteration = 0; iteration < 2; iteration++) {
      const analytics = new AnalyticsClass("test-key", {
         serviceName: "test-electron",
         posthogHost: "https://example.test",
         otlpTraceUrl: "https://example.test/traces",
         otlpLogUrl: "https://example.test/logs",
      });
      shutdown = () => analytics.shutdown();
      analytics.setDefaultAttributes({ "user.id": "test-user" });

      await analytics.startActiveSpan("parent", async (parent) => {
         await Promise.resolve();
         expect(analytics.getActiveSpan()).toBe(parent);
         expect(analytics.getTraceparent()).toContain(parent.spanContext().traceId);
         analytics.withRootContext(() => expect(analytics.getActiveSpan()).toBeUndefined());
         analytics.startActiveSpan("child", () => {});
      });
      expect(analytics.getActiveSpan()).toBeUndefined();
      analytics.log({ body: "test log", level: "info" });
      await analytics.flush();

      const spans = spanExporters[iteration * 2].getFinishedSpans();
      expect(spans.map((span) => span.name)).toEqual(["child", "parent"]);
      expect(spans[0].parentSpanContext?.spanId).toBe(spans[1].spanContext().spanId);
      expect(spans[0].attributes["user.id"]).toBe("test-user");
      expect(logExporters[iteration * 2].getFinishedLogRecords()[0].body).toBe("test log");

      await analytics.shutdown();
      shutdown = undefined;
      expect(context.active()).toBe(ROOT_CONTEXT);
   }
   expect(shutdownPosthog).toHaveBeenCalledTimes(2);
});
