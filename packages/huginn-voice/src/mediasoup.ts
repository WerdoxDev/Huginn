import { env } from "node:process";
import { GatewayCode, type Snowflake } from "@huginn/shared";
import type { Peer } from "crossws";
import mediasoup from "mediasoup";
import type { Router, RtpCodecCapability, WebRtcServer, Worker } from "mediasoup/node/lib/types";
import { envs } from "#index";
import type { RouterType } from "#utils/types";

export const routers = new Map<string, RouterType>();

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
let webRtcServer: WebRtcServer;

export async function runMediasoupWorker() {
	worker = await mediasoup.createWorker({
		logLevel: "warn",
	});

	webRtcServer = await worker.createWebRtcServer({
		listenInfos: [{ ip: envs.MEDIA_IP ?? "", announcedAddress: envs.MEDIA_ANNOUNCED_IP, protocol: "udp", port: Number(envs.MEDIA_PORT) }],
	});

	console.log("mediasoup worker created");

	worker.on("died", () => {
		console.error("mediasoup worker died, exiting...");
		process.exit(1);
	});
}

export async function createRouter(channelId: Snowflake) {
	if (routers.has(channelId)) {
		return routers.get(channelId) as RouterType;
	}

	const router = await worker.createRouter({ mediaCodecs });

	const actualRouter: RouterType = {
		channelId: channelId,
		router,
		peers: new Map(), // peerId -> peer
	};

	routers.set(channelId, actualRouter);

	return actualRouter;
}

export async function createTransport(router: Router) {
	const transport = await router.createWebRtcTransport({
		webRtcServer: webRtcServer,
		enableUdp: true,
		enableTcp: false,
		preferUdp: true,
	});

	return transport;
}

export function verifyPeer(router: RouterType | undefined, peer: Peer, channelId: Snowflake): router is RouterType {
	if (!router || router.channelId !== channelId) {
		return false;
	}

	const peerExists = router.peers.has(peer.id);

	if (!peerExists) {
		peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
	}

	return peerExists;
}
