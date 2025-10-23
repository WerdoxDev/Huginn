import { readEnv } from "@huginn/backend-shared/env-reader";
import crossws from "crossws/adapters/node";
import { VoiceWebsocket } from "./voice-websocket";
import { createServer } from "node:http";
import { runMediasoupWorker } from "#mediasoup";
import type { AddressInfo } from "node:net";

export const envs = readEnv(["VOICE_HOST", "VOICE_PORT", "MEDIA_IP", "MEDIA_ANNOUNCED_HOSTNAMES", "MEDIA_PORT"] as const);

await runMediasoupWorker();

export const voiceWebSocket = new VoiceWebsocket();
export const ws = crossws({
   hooks: {
      open: voiceWebSocket._internalOnOpen.bind(voiceWebSocket),
      close: voiceWebSocket._internalOnClose.bind(voiceWebSocket),
      message: voiceWebSocket._internalOnMessage.bind(voiceWebSocket),
   },
});

const server = createServer().listen(Number(envs.VOICE_PORT), envs.VOICE_HOST);
server.on("listening", () => {
   const info = server.address() as AddressInfo;
   console.log(`Server is running on http://${info.address}:${info.port}`);
});
server.on("upgrade", (req, socket, head) => {
   if (req.headers.upgrade === "websocket") {
      ws.handleUpgrade(req, socket, head);
   }
});
