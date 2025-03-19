import type { Server } from "node:http";
import { serve } from "@hono/node-server";
import crossws from "crossws/adapters/node";
import { Hono } from "hono";
import mediasoup from "mediasoup";
import type { Router, RtpCodecCapability, Worker } from "mediasoup/node/lib/types";
import { VoiceWebSocket } from "./voice-websocket";

const app = new Hono();

const mediaCodecs: RtpCodecCapability[] = [
	{
		kind: "audio",
		mimeType: "audio/opus",
		clockRate: 48000,
		channels: 2,
	},
	{
		kind: "video",
		mimeType: "video/VP8",
		clockRate: 90000,
	},
];

let worker: Worker;

async function runMediasoupWorker() {
	worker = await mediasoup.createWorker({
		logLevel: "warn",
	});

	console.log("mediasoup worker created");

	worker.on("died", () => {
		console.error("mediasoup worker died, exiting...");
		process.exit(1);
	});
}

async function createTransport(router: Router) {
	return await router.createWebRtcTransport({
		listenIps: [
			{ ip: "127.0.0.1", announcedIp: "127.0.0.1" }, // Use your server's public IP in production
		],
		enableUdp: true,
		enableTcp: true,
		preferUdp: true,
	});
}

await runMediasoupWorker();

app.get("/router/join/:id");

export const voiceWebSocket = new VoiceWebSocket();
const ws = crossws({
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
