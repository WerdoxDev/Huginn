import "dotenv/config";
import { readEnv } from "@huginn/runtime-shared";
import { initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { defineHooks } from "crossws";
import { serve } from "crossws/server";
import Elysia from "elysia";

import { runMediasoupWorker } from "#mediasoup";

import { VoiceWebsocket } from "./voice-websocket";

export const envs = readEnv([
   "VOICE_HOST",
   "VOICE_PORT",
   "MEDIA_LISTEN_INFOS",
   "OTEL_SERVICE_NAME",
   "OTLP_TRACE_URL",
   "OTLP_LOG_URL",
   "POSTHOG_HOST",
   "POSTHOG_KEY",
] as const);

initAnalytics(
   new RuntimeAnalytics(envs.POSTHOG_KEY!, {
      serviceName: envs.OTEL_SERVICE_NAME!,
      otlpTraceUrl: envs.OTLP_TRACE_URL,
      otlpLogUrl: envs.OTLP_LOG_URL,
      posthogHost: envs.POSTHOG_HOST,
   }),
);

await runMediasoupWorker();

export const voiceWebSocket = new VoiceWebsocket();

const hooks = defineHooks({
   open: voiceWebSocket._internalOnOpen.bind(voiceWebSocket),
   close: voiceWebSocket._internalOnClose.bind(voiceWebSocket),
   message: voiceWebSocket._internalOnMessage.bind(voiceWebSocket),
});

const main = new Elysia();
serve({ websocket: hooks, fetch: main.fetch, port: envs.VOICE_PORT, hostname: envs.VOICE_HOST });
