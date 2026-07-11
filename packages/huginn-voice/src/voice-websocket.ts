import { CommonWebsocket, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import {
   analytics,
   CONSTANTS,
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
   type VoiceRestartIceData,
   type VoiceResumeConsumerData,
   type VoiceResumeData,
   VoiceSignallingError,
   WorkerID,
   recordSpanError,
} from "@huginn/shared";

import type { RouterData, RTCPeer } from "#utils/types";

import { createRouter, createTransport, getRouterConsumers, getRouterProducers, routers, verifySession } from "#mediasoup";

import { ClientSession } from "./client-session";

export class VoiceWebsocket extends CommonWebsocket<ClientSession, VoicePayload> {
   public constructor() {
      super({ workerId: WorkerID.VOICE, sessionDeleteTimeout: 1000 * 30 }, ClientSession);
   }

   public onOpen(session: ClientSession) {
      analytics.startActiveSpan("voice.onOpen", (span) => {
         span.setAttribute("session.id", session.sessionId);
         try {
            session.send(
               {
                  op: VoiceOperations.HELLO,
                  d: { heartbeatInterval: CONSTANTS.HEARTBEAT_INTERVAL, sessionId: session.sessionId },
               },
               false,
               false,
            );
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public onClose(session: ClientSession, event: { code?: number; reason?: string }): Promise<void> | void {
      analytics.startActiveSpan("voice.onClose", (span) => {
         span.setAttributes(session.getDefaultAttributes());
         if (event.code) span.setAttribute("event.close.code", event.code);
         if (event.reason) span.setAttribute("event.close.reason", event.reason);
         span.end();
      });
   }

   public async onDeleteSession(session: ClientSession) {
      return analytics.startActiveSpan("voice.onDeleteSession", async (span) => {
         span.setAttributes(session.getDefaultAttributes());
         try {
            if (!session.authenticated) return;

            const router = Array.from(routers.values()).find((x) => x.peers.has(session.sessionId));

            span.setAttribute("session.router_found", !!router);

            if (router) {
               const rtcPeer = router.peers.get(session.sessionId);

               if (!rtcPeer) return;

               for (const [_, transportData] of rtcPeer.transports) {
                  transportData.transport.close();
               }

               router.peers.delete(session.sessionId);
               const producerIds = Array.from(rtcPeer.producers.values().map((x) => x.id));
               const consumerIds = Array.from(rtcPeer.consumers.values().map((x) => x.id));

               span.setAttribute("session.producer_count", producerIds.length);
               span.setAttribute("session.consumer_count", consumerIds.length);

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

               if (router.peers.size === 0) {
                  router.router.close();
                  routers.delete(router.channelId);
                  span.setAttribute("session.router_closed", true);
               }
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async onMessage(session: ClientSession, data: VoicePayload) {
      // To skip trace
      if (data.op === VoiceOperations.HEARTBEAT || data.op === VoiceOperations.PING) {
         switch (data.op) {
            case VoiceOperations.PING:
               this.onPing(session);
               break;
            case VoiceOperations.HEARTBEAT:
               this.onHeartbeat(session);
               break;
         }
         return;
      }

      return await analytics.startActiveSpan("voice.onMessage", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.message.op": data.op,
            "params.message.type": "t" in data ? data.t : "null",
         });

         try {
            switch (data.op) {
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
                     case "restart_ice":
                        await this.onRestartIce(session, data.d);
                        break;
                     case "produce":
                        await this.onProduce(session, data.d);
                        break;
                     case "close_producer":
                        this.onCloseProducer(session, data.d);
                        break;
                     case "consume":
                        await this.onConsume(session, data.d);
                        break;
                     case "resume_consumer":
                        await this.onResumeConsumer(session, data.d);
                        break;
                     case "close_consumer":
                        this.onCloseConsumer(session, data.d);
                        break;
                  }
                  break;
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private async onResumeConsumer(session: ClientSession, data: VoiceResumeConsumerData) {
      return await analytics.startActiveSpan("voice.onResumeConsumer", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.consumer_id": data.consumerId,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const consumer = rtcPeer?.consumers.get(data.consumerId);

            if (!consumer) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_CONSUMER);
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

            span.setAttribute("result.consumer_id", data.consumerId);
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
            recordSpanError(e);
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
      });
   }

   private async onConsume(session: ClientSession, data: VoiceConsumeData) {
      return await analytics.startActiveSpan("voice.onConsume", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.producer_id": data.producerId,
            "params.transport_id": data.transportId,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const producerPeer = router.peers.values().find((x) => x.producers.values().find((y) => y.id === data.producerId));
            const producer = producerPeer?.producers.get(data.producerId);
            const transportData = rtcPeer?.transports.get(data.transportId);

            if (!producerPeer || !producer) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_PRODUCER);
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
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_TRANSPORT);
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
               span.setAttribute("result.error", VoiceSignallingError.WRONG_TRANSPORT_DIRECTION);
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

            if (
               !router.router.canConsume({
                  producerId: data.producerId,
                  rtpCapabilities: data.rtpCapabilities,
               })
            ) {
               span.setAttribute("result.error", VoiceSignallingError.ROUTER_CANT_CONSUME);
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

            const consumer = await transportData.transport.consume<MediasoupAppData>({
               producerId: data.producerId,
               rtpCapabilities: data.rtpCapabilities,
               appData: { mediaKind: producer.appData.mediaKind, userId: rtcPeer.userId },
               paused: true,
            });

            rtcPeer?.consumers.set(consumer.id, consumer);

            span.setAttributes({
               "result.consumer_id": consumer.id,
               "result.media_kind": consumer.appData.mediaKind,
               "result.producer_user_id": producerPeer.userId,
            });

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
                  t: "consumer_created",
                  d: {
                     kind: consumer.appData.mediaKind,
                     consumerId: consumer.id,
                     producerId: producer.id,
                     userId: rtcPeer.userId,
                  },
               },
               { excludeSession: session },
            );
         } catch (e) {
            recordSpanError(e);
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
      });
   }

   private async onProduce(session: ClientSession, data: VoiceProduceData) {
      return await analytics.startActiveSpan("voice.onProduce", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.transport_id": data.transportId,
            "params.kind": data.kind,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const transportData = rtcPeer?.transports.get(data.transportId);
            const producerMediaKind = convertToMediaKind(data.kind);

            if (!producerMediaKind) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_MEDIA_KIND);
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
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_TRANSPORT);
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
               span.setAttribute("result.error", VoiceSignallingError.WRONG_TRANSPORT_DIRECTION);
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

            span.setAttributes({
               "result.producer_id": producer.id,
               "result.media_kind": producer.appData.mediaKind,
            });

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
                  t: "producer_created",
                  d: { kind: data.kind, producerId: producer.id, userId: rtcPeer.userId },
               },
               { excludeSession: session },
            );
         } catch (e) {
            recordSpanError(e);
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
      });
   }

   private async onConnectTransport(session: ClientSession, data: VoiceConnectTransportData) {
      return await analytics.startActiveSpan("voice.onConnectTransport", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.transport_id": data.transportId,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const transportData = rtcPeer.transports.get(data.transportId);

            if (!transportData) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_TRANSPORT);
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

            span.setAttribute("result.transport_id", transportData.transport.id);
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
            recordSpanError(e);
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
      });
   }

   private async onCreateTransport(session: ClientSession, data: VoiceCreateTransportData) {
      return await analytics.startActiveSpan("voice.onCreateTransport", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.direction": data.direction,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const transport = await createTransport(router.router);
            const rtcPeer = router.peers.get(session.sessionId);
            rtcPeer?.transports.set(transport.id, { transport, direction: data.direction });

            span.setAttribute("result.transport_id", transport.id);

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
            recordSpanError(e);
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
      });
   }

   private async onRestartIce(session: ClientSession, data: VoiceRestartIceData) {
      return await analytics.startActiveSpan("voice.onRestartIce", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.transport_id": data.transportId,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const transportData = rtcPeer.transports.get(data.transportId);

            if (!transportData) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_TRANSPORT);
               session.send(
                  {
                     op: VoiceOperations.DISPATCH,
                     t: "restart_ice_result",
                     d: { error: VoiceSignallingError.UNKNOWN_TRANSPORT, nonce: data.nonce },
                  },
                  true,
                  true,
               );
               return;
            }

            const iceParameters = await transportData.transport.restartIce();

            span.setAttribute("result.success", true);
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "restart_ice_result",
                  d: { iceParameters, nonce: data.nonce },
               },
               true,
               true,
            );
         } catch (e) {
            recordSpanError(e);
            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "restart_ice_result",
                  d: { error: VoiceSignallingError.UNKNOWN_ERROR, nonce: data.nonce },
               },
               true,
               true,
            );
         }
      });
   }

   private onCloseProducer(session: ClientSession, data: VoiceCloseProducerData) {
      analytics.startActiveSpan("voice.onCloseProducer", (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.producer_id": data.producerId,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const producer = rtcPeer?.producers.get(data.producerId);

            if (!producer) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_PRODUCER);
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

            span.setAttributes({
               "result.producer_id": producer.id,
               "result.media_kind": producer.appData.mediaKind,
            });

            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "close_producer_result",
                  d: {
                     producerId: producer.id,
                     userId: rtcPeer.userId,
                     kind: producer.appData.mediaKind,
                     nonce: data.nonce,
                  },
               },
               true,
               true,
            );

            for (const otherPeer of router.peers.values()) {
               for (const consumer of otherPeer.consumers.values().filter((x) => x.producerId === producer.id)) {
                  consumer.close();
                  otherPeer.consumers.delete(consumer.id);
               }
            }

            this.broadcastToRouter(
               router,
               {
                  op: VoiceOperations.DISPATCH,
                  t: "producer_closed",
                  d: {
                     producerId: producer.id,
                     userId: rtcPeer.userId,
                     kind: producer.appData.mediaKind,
                  },
               },
               { excludeSession: session },
            );
         } catch (e) {
            recordSpanError(e);
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
      });
   }

   private onCloseConsumer(session: ClientSession, data: VoiceCloseConsumerData) {
      analytics.startActiveSpan("voice.onCloseConsumer", (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.consumer_id": data.consumerId,
         });

         try {
            const router = routers.get(data.channelId);

            if (!verifySession(router, session, data.channelId)) return;

            const rtcPeer = router.peers.get(session.sessionId)!;
            const consumer = rtcPeer?.consumers.get(data.consumerId);

            if (!consumer) {
               span.setAttribute("result.error", VoiceSignallingError.UNKNOWN_CONSUMER);
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

            span.setAttributes({
               "result.consumer_id": consumer.id,
               "result.media_kind": consumer.appData.mediaKind,
               "result.producer_id": consumer.producerId,
            });

            session.send(
               {
                  op: VoiceOperations.DISPATCH,
                  t: "close_consumer_result",
                  d: {
                     consumerId: consumer.id,
                     kind: consumer.appData.mediaKind,
                     producerId: consumer.producerId,
                     userId: rtcPeer.userId,
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
                  t: "consumer_closed",
                  d: {
                     producerId: consumer.producerId,
                     userId: rtcPeer.userId,
                     consumerId: consumer.id,
                     kind: consumer.appData.mediaKind,
                  },
               },
               { excludeSession: session },
            );
         } catch (e) {
            recordSpanError(e);
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
      });
   }

   private async onIdentify(session: ClientSession, data: VoiceIdentifyData) {
      return await analytics.startActiveSpan("voice.onIdentify", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId,
            "params.guild_id": data.guildId ?? "null",
         });

         try {
            const { valid, payload } = await verifyToken("voice", data.token);
            span.setAttribute("token.valid", valid);

            if (!valid || !payload) {
               session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
               return;
            }

            const user = await prisma.user.getById(payload.userId, { select: selectPrivateUser });
            span.setAttribute("user.id", user.id);

            const conflictingSession = this.sessions.values().find((x) => x.authenticated && x.user?.id === user.id);
            if (conflictingSession) {
               span.setAttribute("session.conflict_resolved", true);
               conflictingSession.peer.close(GatewayCode.INTENTIONAL_CLOSE, "INTENTIONAL_CLOSE");
               await this.deleteSession(conflictingSession.sessionId);
            }

            await session.initialize(user, {
               token: data.token,
               user,
               channelId: data.channelId,
               guildId: data.guildId,
            });

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

            span.setAttributes({
               "result.channel_id": data.channelId,
               "result.existing_producers": producers.length,
               "result.existing_consumers": consumers.length,
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
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private async onResume(session: ClientSession, data: VoiceResumeData) {
      return await analytics.startActiveSpan("voice.onResume", async (span) => {
         span.setAttributes({ ...session.getDefaultAttributes(), "params.session_id": data.sessionId, "params.seq": data.seq });
         try {
            const { valid, payload } = await verifyToken("voice", data.token);
            span.setAttribute("token.valid", valid);

            if (!valid || !payload) {
               session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
               return;
            }

            const result = await this.resumeSession(session, data.sessionId, data.seq, payload.userId);
            span.setAttribute("resume.result", !!result);

            if (!result) return;

            result.oldSession.send({ op: VoiceOperations.DISPATCH, t: "resumed", d: undefined }, true, false);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private onHeartbeat(session: ClientSession) {
      session.resetHeartbeatTimeout();
      session.send({ op: VoiceOperations.HEARTBEAT_ACK }, false, true);
   }

   private onPing(session: ClientSession) {
      session.send({ op: VoiceOperations.PONG }, false, true);
   }

   private broadcastToRouter(router: RouterData, data: VoicePayload, options?: { excludeSession?: ClientSession }) {
      for (const [otherSessionId] of router.peers) {
         if (otherSessionId === options?.excludeSession?.sessionId) continue;

         const otherSession = this.getSession(otherSessionId);
         if (!otherSession) continue;

         otherSession.send(data, true, true);
      }
   }
}
