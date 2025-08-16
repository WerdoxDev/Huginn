import { CommonWebsocket } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { verifyVoiceToken } from "@huginn/backend-shared/voice-utils";
import {
   constants,
   convertToMediaKind,
   GatewayCode,
   type MediasoupAppData,
   type VoiceCloseConsumerData,
   type VoiceCloseProducerData,
   type VoiceConnectTransportData,
   type VoiceConsumeData,
   type VoiceCreateTransportData,
   type VoiceHeartbeatAck,
   type VoiceHello,
   type VoiceIdentifyData,
   VoiceOperations,
   type VoicePayload,
   type VoicePong,
   type VoiceProduceData,
   type VoiceResumeConsumerData,
   WorkerID,
} from "@huginn/shared";
import { ws } from "#index";
import { createRouter, createTransport, routers, verifyPeer } from "#mediasoup";
import type { RTCPeer } from "#utils/types";
import { ClientSession } from "./client-session";

export class VoiceWebsocket extends CommonWebsocket<ClientSession, VoicePayload> {
   public constructor() {
      super({ workerId: WorkerID.VOICE, sessionDeleteTimeout: 1000 * 30 }, ClientSession);
   }

   public onOpen(session: ClientSession) {
      const helloData: VoiceHello = { op: VoiceOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
      this.send(session.peer, helloData);
   }

   public async onClose(session: ClientSession, _event: { code?: number; reason?: string }) {
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
         for (const producer of rtcPeer.producers.values()) {
            this.handleCloseProducer(session, { channelId: router.channelId, producerId: producer.id });
         }

         router.peers.delete(session.sessionId);
         const producerIds = Array.from(rtcPeer.producers.values().map((x) => x.id));
         for (const [otherPeerId] of router.peers) {
            const peerLeftData: VoicePayload = {
               op: VoiceOperations.DISPATCH,
               t: "peer_left",
               d: { sessionId: session.sessionId, producerIds, userId: rtcPeer.userId },
               s: session.getIncreasedSequence(),
            };
            ws.publish(otherPeerId, JSON.stringify(peerLeftData));
         }

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
            this.handlePing(session);
            break;
         case VoiceOperations.HEARTBEAT:
            this.handleHeartbeat(session);
            break;
         case VoiceOperations.IDENTIFY:
            await this.handleIdentify(session, data.d);
            break;
         case VoiceOperations.DISPATCH:
            switch (data.t) {
               case "create_transport":
                  await this.handleCreateTransport(session, data.d);
                  break;
               case "connect_transport":
                  await this.handleConnectTransport(session, data.d);
                  break;
               case "produce":
                  await this.handleProduce(session, data.d);
                  break;
               case "consume":
                  await this.handleConsume(session, data.d);
                  break;
               case "resume_consumer":
                  await this.handleResumeConsumer(session, data.d);
                  break;
               case "close_producer":
                  this.handleCloseProducer(session, data.d);
                  break;
               case "close_consumer":
                  this.handleCloseConsumer(session, data.d);
                  break;
            }
            break;
      }
   }

   private async handleResumeConsumer(session: ClientSession, data: VoiceResumeConsumerData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const rtcPeer = router.peers.get(session.sessionId);
      const consumer = rtcPeer?.consumers.get(data.consumerId);

      if (!consumer) {
         return;
      }

      await consumer.resume();

      const consumerResumedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "consumer_resumed",
         d: { consumerId: data.consumerId },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, consumerResumedData);
   }

   private async handleConsume(session: ClientSession, data: VoiceConsumeData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const rtcPeer = router.peers.get(session.sessionId);
      const producerPeer = router.peers.values().find((x) => x.producers.values().find((y) => y.id === data.producerId));
      const transportData = rtcPeer?.transports.get(data.transportId);

      if (!rtcPeer || !producerPeer) {
         return;
      }

      if (!transportData || transportData.direction !== "recv") {
         console.log("transport null or wrong type");
         return;
      }

      if (!router.router.canConsume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities })) {
         console.log("router cant consume");
         return;
      }

      const consumer = await transportData.transport.consume<MediasoupAppData>({
         producerId: data.producerId,
         rtpCapabilities: data.rtpCapabilities,
         appData: producerPeer.producers.get(data.producerId)?.appData ?? { mediaKind: "unknown", userId: rtcPeer.userId },
         paused: true,
      });

      rtcPeer?.consumers.set(consumer.id, consumer);

      const consumerCreatedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "consumer_created",
         d: {
            consumerId: consumer.id,
            producerId: data.producerId,
            kind: consumer.appData.mediaKind,
            rtpParameters: consumer.rtpParameters,
            producerUserId: producerPeer.userId,
         },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, consumerCreatedData);
   }

   private async handleProduce(session: ClientSession, data: VoiceProduceData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const rtcPeer = router.peers.get(session.sessionId);
      const transportData = rtcPeer?.transports.get(data.transportId);
      const producerMediaKind = convertToMediaKind(data.kind);

      if (!transportData || transportData.direction !== "send" || !rtcPeer || !producerMediaKind) {
         console.log("Can't produce");
         return;
      }

      const producer = await transportData.transport.produce<MediasoupAppData>({
         kind: producerMediaKind,
         rtpParameters: data.rtpParameters,
         appData: { mediaKind: data.kind, userId: rtcPeer.userId },
      });

      rtcPeer?.producers.set(producer.id, producer);

      for (const [otherSessionId] of router.peers) {
         if (otherSessionId !== session.sessionId) {
            const newProducerData: VoicePayload = {
               op: VoiceOperations.DISPATCH,
               t: "new_producer",
               d: { kind: data.kind, producerId: producer.id, producerUserId: rtcPeer.userId },
               s: session.getIncreasedSequence(),
            };
            ws.publish(otherSessionId, JSON.stringify(newProducerData));
         }
      }

      const producerCreatedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "producer_created",
         d: { producerId: producer.id, kind: producer.appData.mediaKind },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, producerCreatedData);
   }

   private async handleConnectTransport(session: ClientSession, data: VoiceConnectTransportData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const rtcPeer = router.peers.get(session.sessionId);
      const transportData = rtcPeer?.transports.get(data.transportId);

      if (!transportData) {
         return;
      }

      await transportData.transport.connect({ dtlsParameters: data.dtlsParameters });

      const transportConnectedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "transport_connected",
         d: { transportId: transportData.transport.id },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, transportConnectedData);
   }

   private async handleCreateTransport(session: ClientSession, data: VoiceCreateTransportData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const transport = await createTransport(router.router);
      const rtcPeer = router.peers.get(session.sessionId);
      rtcPeer?.transports.set(transport.id, { transport, direction: data.direction });

      const transportCreatedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "transport_created",
         d: {
            transportId: transport.id,
            direction: data.direction,
            params: {
               id: transport.id,
               iceParameters: transport.iceParameters,
               iceCandidates: transport.iceCandidates,
               dtlsParameters: transport.dtlsParameters,
            },
         },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, transportCreatedData);
   }

   private handleCloseProducer(session: ClientSession, data: VoiceCloseProducerData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const rtcPeer = router.peers.get(session.sessionId);
      const producer = rtcPeer?.producers.get(data.producerId);

      if (!producer || !rtcPeer) {
         return;
      }

      producer.close();
      rtcPeer.producers.delete(producer.id);

      const producerClosedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "producer_closed",
         d: { producerId: producer.id, userId: rtcPeer.userId },
         s: session.getIncreasedSequence(),
      };

      for (const [otherPeerId, otherPeer] of router.peers) {
         ws.publish(otherPeerId, JSON.stringify(producerClosedData));

         for (const consumer of otherPeer.consumers.values().filter((x) => x.producerId === data.producerId)) {
            const otherSession = this.sessions.get(otherPeer.sessionId);
            if (!otherSession) {
               continue;
            }

            this.handleCloseConsumer(otherSession, { channelId: data.channelId, consumerId: consumer.id });
         }
      }
   }

   private handleCloseConsumer(session: ClientSession, data: VoiceCloseConsumerData) {
      const router = routers.get(data.channelId);

      if (!verifyPeer(router, session, data.channelId)) {
         return;
      }

      const rtcPeer = router.peers.get(session.sessionId);
      const consumer = rtcPeer?.consumers.get(data.consumerId);

      if (!consumer || !rtcPeer) {
         return;
      }

      consumer?.close();
      rtcPeer.consumers.delete(consumer?.id);

      const consumerClosedData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "consumer_closed",
         d: { consumerId: consumer.id, producerId: consumer.producerId, userId: rtcPeer.userId },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, consumerClosedData);
   }

   private async handleIdentify(session: ClientSession, data: VoiceIdentifyData) {
      const { valid, payload } = await verifyVoiceToken(data.token);

      if (!valid || !payload) {
         session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      const user = await prisma.user.getById(payload.userId, { select: selectPrivateUser });

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

      const producers = Array.from(
         router.peers
            .values()
            .map((x) => Array.from(x.producers.values().map((y) => ({ producerId: y.id, producerUserId: x.userId, kind: y.appData.mediaKind })))),
      ).flat();

      const readyData: VoicePayload = {
         op: VoiceOperations.DISPATCH,
         t: "ready",
         d: { rtpCapabilities: router.router.rtpCapabilities, producers },
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, readyData);
   }

   private handleHeartbeat(session: ClientSession) {
      session.resetHeartbeatTimeout();
      const heartbeatAckData: VoiceHeartbeatAck = { op: VoiceOperations.HEARTBEAT_ACK };
      this.send(session.peer, heartbeatAckData);
   }

   private handlePing(session: ClientSession) {
      const pongData: VoicePong = { op: VoiceOperations.PONG };
      this.send(session.peer, pongData);
   }
}
