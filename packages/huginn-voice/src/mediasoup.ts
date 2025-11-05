import { GatewayCode, type Snowflake } from "@huginn/shared";
import mediasoup from "mediasoup";
import type { Router, RtpCodecCapability, WebRtcServer, Worker } from "mediasoup/node/lib/types";
import type { ClientSession } from "#client-session";
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

export function verifyPeer(router: RouterType | undefined, session: ClientSession, channelId: Snowflake): router is RouterType {
   if (!router || router.channelId !== channelId) {
      return false;
   }

   const peerExists = router.peers.has(session.sessionId);

   if (!peerExists) {
      session.peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
   }

   return peerExists;
}
