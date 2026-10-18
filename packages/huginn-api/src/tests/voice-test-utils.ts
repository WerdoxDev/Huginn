import type { GatewayVoiceStateFlags, HMediaKind, ProducerData } from "@huginnjs/shared";

import { EventEmitter, VoiceOperations } from "@huginnjs/shared";
import { FakeMediaStreamTrack } from "fake-mediastreamtrack";
import { FakeHandler, testFakeParameters } from "mediasoup-client";
import { vi } from "vitest";

import type { Gateway } from "../gateway";
import type { HuginnClient } from "../huginn-client";

import { Voice } from "../voice";
import { VoiceManager } from "../voice-manager";
import { makeClient } from "./test-utils";

// Only the server and browser media boundary are simulated. Voice, signaling,
// transport, device, stream and state managers run together as shipped.
export type WireMessage = { op: number; t?: string; d: Record<string, unknown> };

export class VoiceTestSocket {
   readyState: number = WebSocket.OPEN;
   onopen?: () => void;
   onmessage?: (event: MessageEvent) => void;
   onclose?: (event: CloseEvent) => void;

   constructor(private server: VoiceTestServer) {
      queueMicrotask(() => {
         if (this.readyState !== WebSocket.OPEN) return;
         this.onopen?.();
         this.receive({ op: VoiceOperations.HELLO, d: { sessionId: "voice-session", heartbeatInterval: 30_000 } });
      });
   }

   send(data: string): void {
      const message = JSON.parse(data) as WireMessage;
      this.server.messages.push(message);
      queueMicrotask(() => this.server.respond(this, message));
   }

   close(code = 1000): void {
      this.readyState = WebSocket.CLOSED;
      this.onclose?.({ code, reason: "closed" } as CloseEvent);
   }

   receive(data: unknown): void {
      this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }));
   }

   dispatch(type: string, data: unknown): void {
      this.receive({ op: VoiceOperations.DISPATCH, t: type, d: data, s: ++this.server.sequence });
   }
}

export class VoiceTestServer {
   messages: WireMessage[] = [];
   sockets: VoiceTestSocket[] = [];
   producers: ProducerData[] = [];
   errors: Map<string, number> = new Map();
   autoReply = true;
   sequence = 0;
   private nextId = 0;

   createSocket = (): WebSocket => {
      const socket = new VoiceTestSocket(this);
      this.sockets.push(socket);
      return socket as unknown as WebSocket;
   };

   get socket(): VoiceTestSocket {
      return this.sockets.at(-1)!;
   }
   sent(type: string): WireMessage[] {
      return this.messages.filter((message) => message.t === type);
   }

   respond(socket: VoiceTestSocket, message: WireMessage): void {
      if (socket.readyState !== WebSocket.OPEN) return;
      if (message.op === VoiceOperations.IDENTIFY) {
         socket.dispatch("ready", { rtpCapabilities: testFakeParameters.generateRouterRtpCapabilities(), producers: this.producers, consumers: [] });
         return;
      }
      if (message.op === VoiceOperations.RESUME) {
         socket.dispatch("resumed", {});
         return;
      }
      if (message.op === VoiceOperations.HEARTBEAT) {
         socket.receive({ op: VoiceOperations.HEARTBEAT_ACK });
         return;
      }
      if (!this.autoReply || !message.t) return;

      const { t, d } = message;
      const resultType = t === "produce" ? "produce_result" : t === "consume" ? "consume_result" : `${t}_result`;
      if (this.errors.has(t)) {
         socket.dispatch(resultType, { nonce: d.nonce, error: this.errors.get(t) });
         return;
      }
      let result: Record<string, unknown>;
      switch (t) {
         case "create_transport": {
            const params = testFakeParameters.generateTransportRemoteParameters();
            result = { direction: d.direction, transportId: params.id, params };
            break;
         }
         case "connect_transport":
            result = { transportId: d.transportId };
            break;
         case "produce":
            result = { producerId: `local-${++this.nextId}`, kind: d.kind };
            break;
         case "consume": {
            const producer = this.producers.find((producer) => producer.producerId === d.producerId)!;
            const params = testFakeParameters.generateConsumerRemoteParameters({
               codecMimeType: producer.kind === "camera" || producer.kind === "stream_video" ? "video/VP8" : "audio/opus",
            });
            result = {
               consumerId: params.id,
               producerId: producer.producerId,
               producerUserId: producer.userId,
               kind: producer.kind,
               rtpParameters: params.rtpParameters,
            };
            break;
         }
         case "restart_ice":
            result = { iceParameters: testFakeParameters.generateTransportRemoteParameters().iceParameters };
            break;
         case "close_producer":
            result = { producerId: d.producerId, userId: "user-me", kind: "microphone" };
            break;
         case "resume_consumer":
         case "pause_consumer":
         case "close_consumer":
            result = { consumerId: d.consumerId };
            break;
         default:
            throw new Error(`Unexpected voice command: ${t}`);
      }
      socket.dispatch(resultType, { ...result, nonce: d.nonce });
   }

   addProducer(kind: HMediaKind = "microphone", userId = "remote-user"): ProducerData {
      const producer = { producerId: `remote-${++this.nextId}`, kind, userId };
      this.producers.push(producer);
      this.socket.dispatch("producer_created", producer);
      return producer;
   }
}

export class VoiceTestGateway extends EventEmitter<Record<string, unknown>> {
   status = "authenticated";
   isAuthenticated = true;
   sessionId = "gateway-session";
   user = { id: "user-me" };
   async updateVoiceState(flags: GatewayVoiceStateFlags, channelId: string | null, guildId: string | null): Promise<void> {
      this.emit("voice_state_update", { ...flags, channelId, guildId, userId: this.user.id, sessionId: this.sessionId });
      this.emit("voice_server_update", { token: "voice-token" });
   }
   async sendDefaultVoiceState(): Promise<void> {
      this.emit("voice_state_update", { userId: this.user.id, sessionId: this.sessionId, channelId: null, guildId: null });
   }
}

export function installVoiceEnvironment(): void {
   vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ iceServers: [{ urls: "turn:relay.test:3478" }] })),
   );
}

export type VoiceTestSession = {
   server: VoiceTestServer;
   gateway: VoiceTestGateway;
   client: HuginnClient;
   voice: Voice;
   manager: VoiceManager;
   handlers: FakeHandler[];
};

export function createVoiceSession(): VoiceTestSession {
   const server = new VoiceTestServer();
   const gateway = new VoiceTestGateway();
   let nonce = 0;
   const client = Object.assign(makeClient(), { generateNonce: () => `request-${++nonce}` });
   const handlers: FakeHandler[] = [];
   const handlerFactory = FakeHandler.createFactory(testFakeParameters);
   const createHandler = handlerFactory.factory;
   handlerFactory.factory = (options) => {
      const handler = createHandler(options) as FakeHandler;
      handlers.push(handler);
      const send = handler.send.bind(handler);
      handler.send = async (options) => {
         const result = await send(options);
         let parameters = { encodings: structuredClone(options.encodings ?? [{}]) } as RTCRtpSendParameters;
         const rtpSender = {
            getParameters: () => structuredClone(parameters),
            setParameters: async (next: RTCRtpSendParameters) => {
               parameters = structuredClone(next);
            },
         } as RTCRtpSender;
         return { ...result, rtpSender };
      };
      return handler;
   };
   const voice = new Voice(client, {
      url: "wss://voice.test",
      api: "https://voice.test/voice",
      createSocket: server.createSocket,
      transportOptions: { voiceApi: "https://voice.test/voice", deviceOptions: { handlerFactory } },
   });
   const manager = new VoiceManager(client, gateway as unknown as Gateway, voice);
   return { server, gateway, client, voice, manager, handlers };
}

export function audioTrack(): MediaStreamTrack {
   return new FakeMediaStreamTrack({ kind: "audio" });
}
export function videoTrack(settings: MediaTrackSettings = {}): MediaStreamTrack {
   const track = new FakeMediaStreamTrack({ kind: "video", settings });
   const apply = track.applyConstraints.bind(track);
   track.applyConstraints = async (constraints = {}) => {
      await apply(constraints);
      for (const key of ["width", "height", "frameRate"] as const) {
         if (typeof constraints[key] === "number") settings[key] = constraints[key];
      }
   };
   return track;
}
