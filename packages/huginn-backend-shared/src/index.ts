import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";

initAnalytics(new RuntimeAnalytics(process.env.POSTHOG_KEY!, { serviceName: process.env.OTEL_SERVICE_NAME!, otlpHost: process.env.SIGNOZ_API_URL }));

export * from "./error-factory";
export * from "./elysia-errors";
export * from "./route-importer";
export * from "./route-utils";
export * from "./test-utils";
export * from "./types";
export * from "./websocket/common-client-session";
export * from "./websocket/common-websocket";
export * from "./token-factory";
export * from "./elysia-errors";
export * from "./logger";
