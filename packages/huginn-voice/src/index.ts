import type { Server } from "node:http";
import { serve } from "@hono/node-server";
import { readEnv } from "@huginn/backend-shared/env-reader";
import crossws from "crossws/adapters/node";
import { Hono } from "hono";
import { runMediasoupWorker } from "#mediasoup";
import { VoiceWebSocket } from "./voice-websocket";

export const envs = readEnv(["VOICE_HOST", "VOICE_PORT", "MEDIA_IP", "MEDIA_ANNOUNCED_IP", "MEDIA_PORT"] as const);

const app = new Hono();

await runMediasoupWorker();

export const voiceWebSocket = new VoiceWebSocket();
export const ws = crossws({
	hooks: {
		open: voiceWebSocket.open.bind(voiceWebSocket),
		close: voiceWebSocket.close.bind(voiceWebSocket),
		message: voiceWebSocket.message.bind(voiceWebSocket),
	},
});

const server = serve(
	{
		fetch: app.fetch,
		hostname: envs.VOICE_HOST,
		port: Number(envs.VOICE_PORT),
	},
	(info) => {
		console.log(`Server is running on http://${info.address}:${info.port}`);
	},
) as Server;

server.on("upgrade", (req, socket, head) => {
	if (req.headers.upgrade === "websocket") {
		ws.handleUpgrade(req, socket, head);
	}
});
