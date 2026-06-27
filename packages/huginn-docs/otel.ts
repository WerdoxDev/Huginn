import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// Configure the OTLP log exporter
// It automatically reads OTEL_EXPORTER_OTLP_ENDPOINT and OTEL_EXPORTER_OTLP_HEADERS

// Initialize the OpenTelemetry SDK
console.log("Initializing OpenTelemetry SDK for Huginn Docs...");
const sdk = new NodeSDK({
   resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "nodejs-pino-logger",
   }),
   logRecordProcessor: new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
   instrumentations: [new PinoInstrumentation()],
});

sdk.start();
