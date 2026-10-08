import Elysia from "elysia";

import { env } from "#setup";

type UrlOverrides = Partial<Record<"origin" | "api" | "gateway" | "cdn" | "voice" | "posthog" | "otlp", string>>;

export const getInstance = new Elysia().get("/api/instance", ({ request, status }) => {
   const host = request.headers.get("host") ?? "";
   const proto = request.headers.get("x-forwarded-proto")?.split(",")[0] ?? new URL(request.url).protocol.slice(0, -1);
   const protocol = proto === "https" ? "https" : "http";
   let configured: Record<string, UrlOverrides> = {};
   if (env.INSTANCE_URLS_BY_HOST) {
      try {
         configured = JSON.parse(env.INSTANCE_URLS_BY_HOST);
      } catch {
         return status(500, { error: "Invalid INSTANCE_URLS_BY_HOST configuration" });
      }
      if (!Object.hasOwn(configured, host)) return status(404, { error: "Unknown access address" });
   }
   const origin = configured[host]?.origin ?? `${protocol}://${host}`;
   const socketOrigin = origin.replace(/^http/, "ws");
   const { origin: _configuredOrigin, ...overrides } = configured[host] ?? {};
   return {
      instanceId: env.INSTANCE_ID ?? "huginn",
      urls: {
         api: `${origin}/api`,
         gateway: `${socketOrigin}/gateway`,
         cdn: `${origin}/cdn`,
         voice: `${socketOrigin}/voice`,
         posthog: env.POSTHOG_HOST,
         otlp: env.OTLP_TRACE_URL.replace(/\/v1\/traces\/?$/, "").replace(/\/$/, ""),
         ...overrides,
      },
   };
});
