import { defineHooks } from "crossws";
import { serve } from "crossws/server";
import Elysia from "elysia";

import { env } from "./env";
import { runMediasoupWorker } from "./mediasoup";
import { VoiceWebsocket } from "./voice-websocket";

await runMediasoupWorker();

export const voiceWebSocket = new VoiceWebsocket();

const hooks = defineHooks({
   open: voiceWebSocket._internalOnOpen.bind(voiceWebSocket),
   close: voiceWebSocket._internalOnClose.bind(voiceWebSocket),
   message: voiceWebSocket._internalOnMessage.bind(voiceWebSocket),
});

const main = new Elysia();
serve({ websocket: hooks, fetch: main.fetch, port: env.VOICE_PORT, hostname: env.VOICE_HOST });
