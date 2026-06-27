import type { Router, RouterRtpCodecCapability, TransportProtocol, WebRtcServer, Worker } from "mediasoup/types";

import { logger } from "@huginn/backend-shared/logger";
import { analytics, GatewayCode, recordSpanError, type Snowflake } from "@huginn/shared";
import mediasoup from "mediasoup";

import type { ClientSession } from "#client-session";
import type { RouterData } from "#utils/types";

import { env } from "./env";

export const routers = new Map<string, RouterData>();

export const mediaCodecs: RouterRtpCodecCapability[] = [
   {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
   },
   {
      kind: "video",
      mimeType: "video/h264",
      clockRate: 90000,
      parameters: {
         "packetization-mode": 1,
         "profile-level-id": "42e01f",
         "level-asymmetry-allowed": 1,
         "x-google-start-bitrate": 1000,
      },
   },
];

let worker: Worker;
let webRtcServer: WebRtcServer;

export async function runMediasoupWorker() {
   return analytics.startActiveSpan("mediasoup.runMediasoupWorker", async (span) => {
      try {
         worker = await mediasoup.createWorker({
            logLevel: "warn",
         });

         const listenInfos = env.MEDIA_LISTEN_INFOS?.trim()
            .split(";")
            .map((x) => {
               const split = x.trim().split(":");
               return {
                  protocol: split[0] as TransportProtocol,
                  port: Number(split[1]),
                  ip: split[2],
                  announcedAddress: split[3],
               };
            });

         span.setAttribute("listen_info.count", listenInfos.length);

         if (!listenInfos) throw new Error("MEDIA_LISTEN_INFOS was undefined");

         webRtcServer = await worker.createWebRtcServer({
            listenInfos: listenInfos,
         });

         logger.info("mediasoup worker created");

         worker.on("died", () => {
            logger.error("mediasoup worker died, exiting...");
            process.exit(1);
         });
      } catch (e) {
         recordSpanError(e);
         throw e;
      } finally {
         span.end();
      }
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
      enableTcp: true,
      preferUdp: true,
   });

   return transport;
}

export function verifySession(router: RouterData | undefined, session: ClientSession, channelId: Snowflake): router is RouterData {
   if (!router || router.channelId !== channelId) {
      analytics.getActiveSpan()?.setAttribute("session.invalid_router", true);
      session.peer.close(GatewayCode.NOT_AUTHORIZED, "NOT_AUTHORIZED");
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
