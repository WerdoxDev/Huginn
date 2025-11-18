import { GatewayCode, type Snowflake } from "@huginn/shared";
import mediasoup from "mediasoup";
import type { Router, RouterRtpCodecCapability, WebRtcServer, Worker } from "mediasoup/types";
import type { ClientSession } from "#client-session";
import { envs } from "#index";
import type { RouterData, RTCPeer } from "#utils/types";

export const routers = new Map<string, RouterData>();

const mediaCodecs: RouterRtpCodecCapability[] = [
   {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
   },
   {
      kind: "video",
      mimeType: "video/vp9",
      clockRate: 90000,
   },
];

let worker: Worker;
let webRtcServer: WebRtcServer;

export async function runMediasoupWorker() {
   worker = await mediasoup.createWorker({
      logLevel: "warn",
   });

   const announcedHostnames = envs.MEDIA_ANNOUNCED_HOSTNAMES?.split(",").map((x) => x.trim());

   webRtcServer = await worker.createWebRtcServer({
      listenInfos: announcedHostnames
         ? announcedHostnames?.map((x) => ({ ip: envs.MEDIA_IP ?? "", announcedAddress: x, protocol: "udp", port: Number(envs.MEDIA_PORT) }))
         : [{ ip: envs.MEDIA_IP ?? "", protocol: "udp", port: Number(envs.MEDIA_PORT) }],
   });

   console.log("mediasoup worker created");

   worker.on("died", () => {
      console.error("mediasoup worker died, exiting...");
      process.exit(1);
   });
}

export async function createRouter(channelId: Snowflake) {
   if (routers.has(channelId)) {
      return routers.get(channelId) as RouterData;
   }

   const router = await worker.createRouter({ mediaCodecs });

   const actualRouter: RouterData = {
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

export function verifyPeer(router: RouterData | undefined, session: ClientSession, channelId: Snowflake): router is RouterData {
   if (!router || router.channelId !== channelId) {
      return false;
   }

   const peerExists = router.peers.has(session.sessionId);

   if (!peerExists) {
      session.peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
   }

   return peerExists;
}

export function getRouterProducers(router: RouterData) {
   const peers = router.peers.values();
   const peersProducers = Array.from(peers.map((x) => x.producers));
   const producers = peersProducers.map((x) => Array.from(x.values())).flat();

   return producers;
}

export function getRouterConsumers(router: RouterData) {
   const peers = router.peers.values();
   const peersConsumers = Array.from(peers.map((x) => x.consumers));
   const consumers = peersConsumers.map((x) => Array.from(x.values())).flat();

   return consumers;
}

export function getProducerConsumers(router: RouterData, producerId: string) {
   const consumers = getRouterConsumers(router);
   const producerConsumers = consumers.filter((x) => x.producerId === producerId);
   return producerConsumers;
}
