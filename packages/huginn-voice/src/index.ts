import crossws from "crossws/adapters/bun";
import Elysia from "elysia";
import { websocket } from "elysia/websocket";

import { env } from "./env";
import { runMediasoupWorker } from "./mediasoup";
import { VoiceWebsocket } from "./voice-websocket";

await runMediasoupWorker();

export const voiceWebSocket = new VoiceWebsocket();

const ws = crossws({
   hooks: {
      open: voiceWebSocket._internalOnOpen.bind(voiceWebSocket),
      close: voiceWebSocket._internalOnClose.bind(voiceWebSocket),
      message: voiceWebSocket._internalOnMessage.bind(voiceWebSocket),
   },
});

export const app = new Elysia().use(websocket()).ws("/", {
   upgrade({ request, server }) {
      return ws.handleUpgrade(request, server!);
   },
});

app.listen({
   websocket: ws.websocket,
   hostname: env.VOICE_HOST,
   port: env.VOICE_PORT,
});
