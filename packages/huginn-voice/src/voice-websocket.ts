import { CommonWebsocket, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import {
   constants,
   type ConsumerData,
   convertToMediaKind,
   GatewayCode,
   type MediasoupAppData,
   type ProducerData,
   type VoiceCloseConsumerData,
   type VoiceCloseProducerData,
   type VoiceConnectTransportData,
   type VoiceConsumeData,
   type VoiceCreateTransportData,
   type VoiceIdentifyData,
   VoiceOperations,
   type VoicePayload,
   type VoiceProduceData,
   type VoiceResumeConsumerData,
   type VoiceResumeData,
   VoiceSignallingError,
   WorkerID,
} from "@huginn/shared";
import { createRouter, createTransport, getRouterConsumers, getRouterProducers, routers, verifyPeer } from "#mediasoup";
import type { RouterData, RTCPeer } from "#utils/types";
import { ClientSession } from "./client-session";

export class VoiceWebsocket extends CommonWebsocket<ClientSession, VoicePayload> {
   public constructor() {
      super({ workerId: WorkerID.VOICE, sessionDeleteTimeout: 1000 * 30 }, ClientSession);
   }

   public onOpen(session: ClientSession) {
      session.send({ op: VoiceOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL, sessionId: session.sessionId } }, false, false);
   }

   public onClose(session: ClientSession, event: { code?: number; reason?: string }): Promise<void> | void {}

   public async onDeleteSession(session: ClientSession) {
      if (!session.authenticated) return;

      const router = Array.from(routers.values()).find((x) => x.peers.has(session.sessionId));

      if (router) {
         const rtcPeer = router.peers.get(session.sessionId);

         if (!rtcPeer) {
            return;
         }

         for (const [_, transportData] of rtcPeer.transports) {
            transportData.transport.close();
         }

         // Send producer_closed for all of the user producers
         // for (const producer of rtcPeer.producers.values()) {
         //    this.onCloseProducer(session, { channelId: router.channelId, producerId: producer.id });
         // }

         router.peers.delete(session.sessionId);
         const producerIds = Array.from(rtcPeer.producers.values().map((x) => x.id));
         const consumerIds = Array.from(rtcPeer.consumers.values().map((x) => x.id));

         // Close all producers of this peer plus any consumers consuming this peer's producers
         for (const producer of rtcPeer.producers.values()) {
            producer.close();

            for (const otherPeer of router.peers.values()) {
               for (const consumer of otherPeer.consumers.values().filter((x) => x.producerId === producer.id)) {
                  consumer.close();
                  otherPeer.consumers.delete(consumer.id);
               }
            }
         }

         this.broadcastToRouter(router, {
            op: VoiceOperations.DISPATCH,
            t: "peer_left",
            d: { sessionId: session.sessionId, producerIds, consumerIds, userId: rtcPeer.userId },
         });

         // If room is empty, close it
         if (router.peers.size === 0) {
            router.router.close();
            routers.delete(router.channelId);
         }
      }
   }

   public async onMessage(session: ClientSession, data: VoicePayload) {
      switch (data.op) {
         case VoiceOperations.PING:
            this.onPing(session);
            break;
         case VoiceOperations.HEARTBEAT:
            this.onHeartbeat(session);
            break;
         case VoiceOperations.IDENTIFY:
            await this.onIdentify(session, data.d);
            break;
         case VoiceOperations.RESUME:
            await this.onResume(session, data.d);
            break;
         case VoiceOperations.DISPATCH:
            switch (data.t) {
               case "create_transport":
                  await this.onCreateTransport(session, data.d);
                  break;
               case "connect_transport":
                  await this.onConnectTransport(session, data.d);
                  break;
               case "produce":
                  await this.onProduce(session, data.d);
                  break;
               case "consume":
                  await this.onConsume(session, data.d);
                  break;
               case "resume_consumer":
                  await this.onResumeConsumer(session, data.d);
                  break;
               case "close_producer":
                  this.onCloseProducer(session, data.d);
                  break;
               case "close_consumer":
                  this.onCloseConsumer(session, data.d);
                  break;
            }
            break;
      }
   }

   private async onResumeConsumer(session: ClientSession, data: VoiceResumeConsumerData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const rtcPeer = router.peers.get(session.sessionId)!;
         const consumer = rtcPeer?.consumers.get(data.consumerId);

         if (!consumer) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "resume_consumer_result",
                  d: { error: VoiceSignallingError.UNKNOWN_CONSUMER, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         await consumer.resume();

         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "resume_consumer_result",
               d: { consumerId: data.consumerId, nonce: data.nonce },
            },
            true,
            true,
         );
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "resume_consumer_result",
               d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private async onConsume(session: ClientSession, data: VoiceConsumeData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const rtcPeer = router.peers.get(session.sessionId)!;
         const producerPeer = router.peers.values().find((x) => x.producers.values().find((y) => y.id === data.producerId));
         const producer = producerPeer?.producers.get(data.producerId);
         const transportData = rtcPeer?.transports.get(data.transportId);

         if (!producerPeer || !producer) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "consume_result",
                  d: { error: VoiceSignallingError.UNKNOWN_PRODUCER, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         if (!transportData) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "consume_result",
                  d: { error: VoiceSignallingError.UNKNOWN_TRANSPORT, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         if (transportData.direction !== "recv") {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "consume_result",
                  d: { error: VoiceSignallingError.WRONG_TRANSPORT_DIRECTION, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         if (!router.router.canConsume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities })) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "consume_result",
                  d: { error: VoiceSignallingError.ROUTER_CANT_CONSUME, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         // console.log(JSON.stringify(data, null, 2));
         const consumer = await transportData.transport.consume<MediasoupAppData>({
            producerId: data.producerId,
            rtpCapabilities: data.rtpCapabilities,
            appData: { mediaKind: producer.appData.mediaKind, userId: rtcPeer.userId },
            paused: true,
         });

         rtcPeer?.consumers.set(consumer.id, consumer);

         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "consume_result",
               d: {
                  consumerId: consumer.id,
                  producerId: data.producerId,
                  kind: consumer.appData.mediaKind,
                  rtpParameters: consumer.rtpParameters,
                  producerUserId: producerPeer.userId,
                  nonce: data.nonce,
               },
            },
            true,
            true,
         );

         this.broadcastToRouter(
            router,
            {
               op: VoiceOperations.DISPATCH,
               t: "new_consumer",
               d: { kind: consumer.appData.mediaKind, consumerId: consumer.id, producerId: producer.id, userId: rtcPeer.userId },
            },
            session,
         );
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "consume_result",
               d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private async onProduce(session: ClientSession, data: VoiceProduceData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const rtcPeer = router.peers.get(session.sessionId)!;
         const transportData = rtcPeer?.transports.get(data.transportId);
         const producerMediaKind = convertToMediaKind(data.kind);

         if (!producerMediaKind) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "produce_result",
                  d: { error: VoiceSignallingError.UNKNOWN_MEDIA_KIND, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         if (!transportData) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "produce_result",
                  d: { error: VoiceSignallingError.UNKNOWN_TRANSPORT, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         if (transportData.direction !== "send") {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "produce_result",
                  d: { error: VoiceSignallingError.WRONG_TRANSPORT_DIRECTION, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         const producer = await transportData.transport.produce<MediasoupAppData>({
            kind: producerMediaKind,
            rtpParameters: data.rtpParameters,
            appData: { mediaKind: data.kind, userId: rtcPeer.userId },
         });

         rtcPeer.producers.set(producer.id, producer);

         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "produce_result",
               d: { producerId: producer.id, kind: producer.appData.mediaKind, nonce: data.nonce },
            },
            true,
            true,
         );

         this.broadcastToRouter(
            router,
            {
               op: VoiceOperations.DISPATCH,
               t: "new_producer",
               d: { kind: data.kind, producerId: producer.id, userId: rtcPeer.userId },
            },
            session,
         );
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "produce_result",
               d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private async onConnectTransport(session: ClientSession, data: VoiceConnectTransportData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const rtcPeer = router.peers.get(session.sessionId)!;
         const transportData = rtcPeer.transports.get(data.transportId);

         if (!transportData) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "connect_transport_result",
                  d: { error: VoiceSignallingError.UNKNOWN_TRANSPORT, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         await transportData.transport.connect({ dtlsParameters: data.dtlsParameters });

         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "connect_transport_result",
               d: { transportId: transportData.transport.id, nonce: data.nonce },
            },
            true,
            true,
         );
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "connect_transport_result",
               d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private async onCreateTransport(session: ClientSession, data: VoiceCreateTransportData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const transport = await createTransport(router.router);
         const rtcPeer = router.peers.get(session.sessionId);
         rtcPeer?.transports.set(transport.id, { transport, direction: data.direction });

         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "create_transport_result",
               d: {
                  transportId: transport.id,
                  direction: data.direction,
                  params: {
                     id: transport.id,
                     iceParameters: transport.iceParameters,
                     iceCandidates: transport.iceCandidates,
                     dtlsParameters: transport.dtlsParameters,
                  },
                  nonce: data.nonce,
               },
            },
            true,
            true,
         );
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "create_transport_result",
               d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private onCloseProducer(session: ClientSession, data: VoiceCloseProducerData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const rtcPeer = router.peers.get(session.sessionId)!;
         const producer = rtcPeer?.producers.get(data.producerId);

         if (!producer) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "close_producer_result",
                  d: { error: VoiceSignallingError.UNKNOWN_PRODUCER, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         producer.close();
         rtcPeer.producers.delete(producer.id);

         for (const [otherSessionId, otherPeer] of router.peers) {
            // See if any consumers of this peer was consuming the deleted producer
            for (const consumer of otherPeer.consumers.values().filter((x) => x.producerId === producer.id)) {
               consumer.close();
               otherPeer.consumers.delete(consumer.id);
            }

            const otherSession = this.getSession(otherSessionId);
            if (!otherSession) continue;

            otherSession.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "close_producer_result",
                  d: { producerId: producer.id, userId: rtcPeer.userId, kind: producer.appData.mediaKind, nonce: data.nonce },
               },
               true,
               true,
            );
         }
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "close_producer_result",
               d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private onCloseConsumer(session: ClientSession, data: VoiceCloseConsumerData) {
      try {
         const router = routers.get(data.channelId);

         if (!verifyPeer(router, session, data.channelId)) return;

         const rtcPeer = router.peers.get(session.sessionId)!;
         const consumer = rtcPeer?.consumers.get(data.consumerId);

         if (!consumer) {
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "close_consumer_result",
                  d: { error: VoiceSignallingError.UNKNOWN_CONSUMER, nonce: data.nonce },
               },
               true,
               true,
            );
            return;
         }

         consumer.close();
         rtcPeer.consumers.delete(consumer?.id);

         this.broadcastToRouter(router, {
            op: VoiceOperations.DISPATCH,
            t: "close_consumer_result",
            d: {
               producerId: consumer.producerId,
               userId: rtcPeer.userId,
               consumerId: consumer.id,
               kind: consumer.appData.mediaKind,
               nonce: data.nonce,
            },
         });
      } catch (e) {
         console.error(e);
         session.send(
            {
               op: VoiceOperations.DISPATCH,
               t: "close_consumer_result",
               d: { error: VoiceSignallingError.UNKNOWN_CONSUMER, nonce: data.nonce },
            },
            true,
            true,
         );
      }
   }

   private async onIdentify(session: ClientSession, data: VoiceIdentifyData) {
      const { valid, payload } = await verifyToken("voice", data.token);

      if (!valid || !payload) {
         session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      const user = await prisma.user.getById(payload.userId, { select: selectPrivateUser });

      // If another session with this user's id is available, close that
      const conflictingSession = this.sessions.values().find((x) => x.authenticated && x.user?.id === user.id);
      if (conflictingSession) {
         conflictingSession.peer.close(GatewayCode.INTENTIONAL_CLOSE, "INTENTIONAL_CLOSE");
         await this.deleteSession(conflictingSession.sessionId);
      }

      await session.initialize(user, { token: data.token, user, channelId: data.channelId, guildId: data.guildId });

      const router = await createRouter(data.channelId);

      const rtcPeer: RTCPeer = {
         sessionId: session.sessionId,
         consumers: new Map(),
         producers: new Map(),
         transports: new Map(),
         userId: user.id,
      };
      router.peers.set(session.sessionId, rtcPeer);

      const producers = getRouterProducers(router)
         .filter((x) => x.appData.userId !== user.id)
         .map((x) => {
            const producer: ProducerData = {
               userId: x.appData.userId,
               kind: x.appData.mediaKind,
               producerId: x.id,
            };

            return producer;
         });

      const consumers = getRouterConsumers(router)
         .filter((x) => x.appData.userId !== user.id)
         .map((x) => {
            const consumer: ConsumerData = {
               userId: x.appData.userId,
               kind: x.appData.mediaKind,
               consumerId: x.id,
               producerId: x.producerId,
            };

            return consumer;
         });

      session.send(
         {
            op: VoiceOperations.DISPATCH,
            t: "ready",
            d: { rtpCapabilities: router.router.rtpCapabilities, producers, consumers },
         },
         true,
         false,
      );
   }

   private async onResume(session: ClientSession, data: VoiceResumeData) {
      const { valid, payload } = await verifyToken("voice", data.token);

      if (!valid || !payload) {
         session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      const result = await this.resumeSession(session, data.sessionId, data.seq, payload.userId);
      if (!result) return;

      result.oldSession.send({ op: VoiceOperations.DISPATCH, t: "resumed", d: undefined }, true, false);
   }

   private onHeartbeat(session: ClientSession) {
      session.resetHeartbeatTimeout();
      session.send({ op: VoiceOperations.HEARTBEAT_ACK }, false, true);
   }

   private onPing(session: ClientSession) {
      session.send({ op: VoiceOperations.PONG }, false, true);
   }

   private broadcastToRouter(router: RouterData, data: VoicePayload, excludeSession?: ClientSession) {
      for (const [otherSessionId] of router.peers) {
         if (otherSessionId === excludeSession?.sessionId) continue;

         const otherSession = this.getSession(otherSessionId);
         if (!otherSession) continue;

         otherSession.send(data, true, true);
      }
   }
}
