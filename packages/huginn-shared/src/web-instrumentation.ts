import type { Span } from "@opentelemetry/api";

import { logs } from "@opentelemetry/api-logs";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
// import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";

export function setupWebInstrumentation(
   options: {
      otlpTraceUrl: string;
      otlpLogUrl: string;
      posthogHost: string;
      posthogApiKey: string;
      serviceName: string;
      serviceVersion?: string;
      clientId?: string;
   },
   requestHook: (span: Span) => void,
): void {
   const logProvider = new LoggerProvider({
      processors: [
         new BatchLogRecordProcessor(new OTLPLogExporter({ url: options.otlpLogUrl })),
         new BatchLogRecordProcessor(
            new OTLPLogExporter({ url: `${options.posthogHost}/i/v1/logs`, headers: { Authorization: `Bearer ${options.posthogApiKey}` } }),
         ),
      ],
      resource: resourceFromAttributes({
         "service.name": options.serviceName,
         "service.version": options.serviceVersion,
         "client.id": options.clientId,
      }),
   });

   logs.setGlobalLoggerProvider(logProvider);

   const provider = new WebTracerProvider({
      resource: resourceFromAttributes({
         "service.name": options.serviceName,
         "service.version": options.serviceVersion,
         "client.id": options.clientId,
         electron: "__IS_ELECTRON__" in window && window.__IS_ELECTRON__ ? true : false,
      }),
      spanProcessors: [
         new BatchSpanProcessor(
            new OTLPTraceExporter({
               url: options.otlpTraceUrl,
            }),
         ),
         new BatchSpanProcessor(
            new OTLPTraceExporter({ url: `${options.posthogHost}/i/v1/traces`, headers: { Authorization: `Bearer ${options.posthogApiKey}` } }),
         ),
      ],
   });

   provider.register({
      contextManager: new ZoneContextManager(),
   });

   registerInstrumentations({
      instrumentations: [
         new FetchInstrumentation({
            // Selects which backend servers are allowed to receive trace headers for linking traces across services.
            // Using /.*/ acts as a wildcard. For safer usage in production, replace with specific domains:
            // e.g. propagateTraceHeaderCorsUrls: [/api\.example\.com/, /my-backend\.internal/]
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
}
