import type { Server } from "node:http";
import { serve } from "@hono/node-server";
import crossws from "crossws/adapters/node";
import { Hono } from "hono";
import { runMediasoupWorker } from "#mediasoup";
import { VoiceWebSocket } from "./voice-websocket";

const app = new Hono();

app.get("/router/join/:id");

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
		port: 3003,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
) as Server;

server.on("upgrade", (req, socket, head) => {
	if (req.headers.upgrade === "websocket") {
		ws.handleUpgrade(req, socket, head);
	}
});
