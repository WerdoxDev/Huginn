import { context, metrics, propagation, trace, type Span } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { AggregationTemporalityPreference, OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
// import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";

export function setupWebInstrumentation(
   options: {
      posthogHost: string;
      posthogApiKey: string;
      serviceName: string;
      serviceVersion?: string;
      clientId?: string;
   },
   requestHook: (span: Span) => void,
): { forceFlush: () => Promise<void>; shutdown: () => Promise<void> } {
   const posthogHost = options.posthogHost.replace(/\/+$/, "");
   const logRecordProcessors = [
      new BatchLogRecordProcessor({
         exporter: new OTLPLogExporter({ url: `${posthogHost}/i/v1/logs`, headers: { Authorization: `Bearer ${options.posthogApiKey}` } }),
      }),
   ];
   const logProvider = new LoggerProvider({
      processors: logRecordProcessors,
      resource: resourceFromAttributes({
         "service.name": options.serviceName,
         "service.version": options.serviceVersion,
         "client.id": options.clientId,
      }),
   });

   logs.setGlobalLoggerProvider(logProvider);

   const spanProcessors = [
      new BatchSpanProcessor(new OTLPTraceExporter({ url: `${posthogHost}/i/v1/traces`, headers: { Authorization: `Bearer ${options.posthogApiKey}` } })),
   ];
   const provider = new WebTracerProvider({
      resource: resourceFromAttributes({
         "service.name": options.serviceName,
         "service.version": options.serviceVersion,
         "client.id": options.clientId,
         electron: "__IS_ELECTRON__" in window && window.__IS_ELECTRON__ ? true : false,
      }),
      spanProcessors,
   });

   // Use the default stack context manager without patching browser async APIs.
   provider.register();

   const meterProvider = new MeterProvider({
      resource: resourceFromAttributes({ "service.name": options.serviceName, "service.version": options.serviceVersion }),
      readers: [
         new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
               url: `${posthogHost}/i/v1/metrics`,
               headers: { Authorization: `Bearer ${options.posthogApiKey}` },
               temporalityPreference: AggregationTemporalityPreference.DELTA,
            }),
            exportIntervalMillis: 15000,
         }),
      ],
   });
   metrics.setGlobalMeterProvider(meterProvider);

   const unregisterInstrumentations = registerInstrumentations({
      instrumentations: [
         new FetchInstrumentation({
            // Selects which backend servers are allowed to receive trace headers for linking traces across services.
            // Using /.*/ acts as a wildcard. For safer usage in production, replace with specific domains:
            // e.g. propagateTraceHeaderCorsUrls: [/api\.example\.com/, /my-backend\.internal/]
            ignoreUrls: [/^https?:\/\/(.*\.)?cloudflare\.com/],
            propagateTraceHeaderCorsUrls: /.*/,
            requestHook: requestHook,
         }),
         //  new UserInteractionInstrumentation({
         //    eventNames: ['click', 'input', 'submit'],
         //  }),
         new XMLHttpRequestInstrumentation({
            propagateTraceHeaderCorsUrls: /.*/,
            applyCustomAttributesOnSpan: requestHook,
         }),
      ],
   });

   return {
      forceFlush: async () => {
         await Promise.all([logProvider.forceFlush(), provider.forceFlush(), meterProvider.forceFlush()]);
      },
      shutdown: async () => {
         unregisterInstrumentations();
         try {
            await Promise.all([logProvider.shutdown(), provider.shutdown(), meterProvider.shutdown()]);
         } finally {
            logs.disable();
            metrics.disable();
            trace.disable();
            context.disable();
            propagation.disable();
         }
      },
   };
}
