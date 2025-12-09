import { readEnv } from "@huginn/backend-shared/env-reader";
import { serve } from "crossws/server";
import { defineHooks } from "crossws";
import { VoiceWebsocket } from "./voice-websocket";
import { runMediasoupWorker } from "#mediasoup";
import Elysia from "elysia";

export const envs = readEnv(["VOICE_HOST", "VOICE_PORT", "MEDIA_LISTEN_INFOS"] as const);

await runMediasoupWorker();

export const voiceWebSocket = new VoiceWebsocket();

const hooks = defineHooks({
   open: voiceWebSocket._internalOnOpen.bind(voiceWebSocket),
   close: voiceWebSocket._internalOnClose.bind(voiceWebSocket),
   message: voiceWebSocket._internalOnMessage.bind(voiceWebSocket),
});

const main = new Elysia();
serve({ websocket: hooks, fetch: main.fetch, port: envs.VOICE_PORT, hostname: envs.VOICE_HOST });
