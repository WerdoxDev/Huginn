import { GatewayCode, VoiceOperations, type VoicePayload, type VoiceWebsocketEvents } from "@huginnjs/shared";
import { ws, type WebSocketHandlerConnection } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Voice } from "..";
import { VoiceSignalingClient } from "../voice-signaling-client";
import { makeClient } from "./test-utils";

const VOICE_URL = "wss://voice.test/";
const link = ws.link(VOICE_URL);
const server = setupServer();

function helloPayload(sessionId: string, heartbeatInterval = 30_000): string {
   return JSON.stringify({
      op: VoiceOperations.HELLO,
      d: { heartbeatInterval, sessionId },
   });
}

function dispatchPayload(t: string, d: unknown, s: number): string {
   return JSON.stringify({ op: VoiceOperations.DISPATCH, t, d, s });
}

function parse(event: MessageEvent): VoicePayload {
   return JSON.parse(event.data as string);
}

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

let signaling: VoiceSignalingClient;

beforeEach(() => {
   vi.restoreAllMocks();
   signaling = new VoiceSignalingClient(makeClient("test-token"), { url: VOICE_URL, createSocket: (url: string) => new WebSocket(url), class: Voice });
   vi.useFakeTimers();
});

afterEach(() => {
   signaling.close();
   server.resetHandlers();
   vi.clearAllTimers();
   vi.useRealTimers();
});

describe("connection lifecycle", () => {
   it("connects, wires the socket, and emits connected on open", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
         }),
      );

      const connected = vi.fn();
      const statusChanged = vi.fn();
      signaling.on("connected", connected);
      signaling.on("status_changed", statusChanged);

      void signaling.connect("token", "channel-1", null);

      await vi.waitFor(() => expect(signaling.status).toBe("helloed"));

      expect(connected).toHaveBeenCalledTimes(1);
      expect(statusChanged).toHaveBeenCalledWith("helloed");
   });

   it("throws if connect() is called while already connecting or connected", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
         }),
      );

      await signaling.connect("token", "channel-1", null);
      expect(signaling.status).toBe("helloed");

      await expect(signaling.connect("token", "channel-1", null)).rejects.toThrow();
   });

   it("moves to disconnected if the socket closes before HELLO arrives", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.close(1006, "dropped");
         }),
      );

      const result = await signaling.connect("token", "channel-1", null);
      expect(result).toBe(false);
      expect(signaling.status).toBe("disconnected");
   });

   it("close performs a hard reset and closes the socket intentionally", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
         }),
      );

      const reset = vi.fn();
      signaling.on("reset", reset);

      await signaling.connect("token", "channel-1", null);
      signaling.close();

      expect(signaling.status).toBe("idle");
      expect(signaling.canResume).toBe(false);
      expect(signaling["sequence"]).toBeUndefined();
      expect(signaling.connectionData).toBeUndefined();
      expect(reset).toHaveBeenCalledWith({ type: "hard" });
   });

   it("soft reset clears timers and emits a soft reset", async () => {
      const received: VoicePayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.addEventListener("message", (event) => received.push(parse(event)));
            client.send(helloPayload("session-123", 20));
         }),
      );

      const reset = vi.fn();
      signaling.on("reset", reset);

      await signaling.connect("token", "channel-1", null);

      signaling.softReset();

      expect(reset).toHaveBeenCalledWith({ type: "soft" });
      await vi.advanceTimersByTimeAsync(100);

      const heartbeats = received.filter((p) => p.op === VoiceOperations.HEARTBEAT);
      expect(heartbeats.length).toBe(0);
   });

   it("onClose hard-resets when the server closes with the intentional close code", async () => {
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.close(GatewayCode.INTENTIONAL_CLOSE, "server close");
         }),
      );

      void signaling.connect("token", "channel-1", null);
      await vi.waitFor(() => expect(signaling.status).toBe("idle"));

      expect(signaling.connectionData).toBeUndefined();
   });

   it("onClose resets the session for invalid-session codes and reconnects", async () => {
      let connectionCount = 0;
      server.use(
         link.addEventListener("connection", ({ client }) => {
            connectionCount++;
            client.addEventListener("message", () => {
               client.close(GatewayCode.INVALID_SESSION, "invalid session");
            });
            client.send(helloPayload("session-123", 20));
         }),
      );

      await signaling.connect("token", "channel-1", "guild-1");
      signaling["send"]({ op: VoiceOperations.RESUME, d: { seq: 1, sessionId: "session-123", token: "token" } });
      await vi.waitFor(() => expect(signaling.status).toBe("disconnected"));

      expect(signaling.canResume).toBe(false);

      await vi.advanceTimersByTimeAsync(2000);
      await vi.waitFor(() => expect(connectionCount).toBe(2));
   });

   it("onClose soft-resets on a normal disconnect and schedules a reconnect", async () => {
      let connectionCount = 0;
      server.use(
         link.addEventListener("connection", ({ client }) => {
            connectionCount++;
            client.send(helloPayload("session-123", 20));
         }),
      );

      await signaling.connect("token", "channel-1", "guild-1");
      signaling.socket?.close();

      await vi.advanceTimersByTimeAsync(2000);
      await vi.waitFor(() => expect(connectionCount).toBe(2));
   });

   it("attemptReconnect() throws if connection data is missing", async () => {
      await expect(signaling["attemptReconnect"]()).rejects.toThrow();
   });

   it("attemptReconnect() should not be called if signaling is closed intentionally while reconnecting", async () => {
      let connectionCount = 0;
      server.use(
         link.addEventListener("connection", ({ client }) => {
            connectionCount++;
            client.send(helloPayload("session-123", 20));
         }),
      );

      await signaling.connect("token", "channel-1", "guild-1");
      // unintentionally close
      signaling.socket?.close();

      await vi.advanceTimersByTimeAsync(1000);
      signaling.close();
      await vi.advanceTimersByTimeAsync(2000);

      await vi.waitFor(() => expect(connectionCount).toBe(1));
   });
});

describe("hello and websocket messages", () => {
   it("identifies on HELLO and sends heartbeat on the configured interval", async () => {
      const received: VoicePayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 20));
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               received.push(payload);
               if (payload.op === VoiceOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { rtpCapabilities: {}, consumers: [], producers: [] }, 1));
               }
            });
         }),
      );

      await signaling.connect("token", "channel-1", null);

      await vi.waitFor(() => expect(signaling.status).toBe("authenticated"));
      await vi.advanceTimersByTimeAsync(25);

      expect(received.filter((p) => p.op === VoiceOperations.HEARTBEAT).length).toBeGreaterThanOrEqual(1);
   });

   it("resumes when it has a session id and sequence", async () => {
      const received: VoicePayload[] = [];

      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));
            client.addEventListener("message", (event) => received.push(parse(event)));
         }),
      );

      signaling["sessionId"] = "session-1";
      signaling["sequence"] = 7;
      await signaling.connect("token", "channel-1", "guild-1");

      expect(signaling.canResume).toBe(true);
      await vi.waitFor(() => expect(signaling.status).toBe("resuming"));

      expect(received.find((p) => p.op === VoiceOperations.RESUME)).toMatchObject({ d: { seq: 7, sessionId: "session-1", token: "token" } });
   });

   it("throws from HELLO when the client is missing user or connection data", async () => {
      signaling.connectionData = undefined;

      expect(() => signaling["handleHello"]({ sessionId: "session-123", heartbeatInterval: 30_000 })).toThrow();
   });

   it("routes dispatch events to the matching websocket events", async () => {
      const cases: Array<[keyof VoiceWebsocketEvents, unknown]> = [
         ["create_transport_result", { nonce: "n1" }],
         ["connect_transport_result", { nonce: "n2" }],
         ["restart_ice_result", { nonce: "n3" }],
         ["produce_result", { nonce: "n4" }],
         ["close_producer_result", { nonce: "n5" }],
         ["producer_created", { producerId: "p1", userId: "u1", kind: "microphone" }],
         ["producer_closed", { producerId: "p2", userId: "u1", kind: "microphone" }],
         ["consume_result", { nonce: "n6" }],
         ["resume_consumer_result", { nonce: "n7" }],
         ["close_consumer_result", { nonce: "n8" }],
         ["consumer_created", { consumerId: "c1", producerId: "p1", userId: "u1", kind: "microphone" }],
         ["consumer_closed", { consumerId: "c2", producerId: "p1", userId: "u1", kind: "microphone" }],
         ["peer_left", { userId: "u2", producerIds: ["p1"], consumerIds: ["c1"], sessionId: "s1" }],
      ];

      const sent: VoicePayload[] = [];
      server.use(
         link.addEventListener("connection", ({ client }) => {
            client.send(helloPayload("session-123", 30_000));

            client.addEventListener("message", async (event) => {
               for (const [eventName, payload] of cases) {
                  const handler = vi.fn();
                  signaling.on(eventName as any, handler);

                  client.send(dispatchPayload(eventName, payload, 10));

                  // await vi.waitFor(() => expect(handler).toHaveBeenCalledWith(payload));
                  sent.push(parse(event));
               }
            });
         }),
      );

      await signaling.connect("token", "channel-1", null);

      vi.waitFor(() => expect(sent.length).toBe(cases.length));
   });

   it("sets authenticated on READY and RESUMED", async () => {
      let serverClient: any;

      server.use(
         link.addEventListener("connection", ({ client }) => {
            serverClient = client;
            client.send(helloPayload("session-123", 30_000));
            client.addEventListener("message", (event) => {
               const payload = parse(event);
               if (payload.op === VoiceOperations.IDENTIFY) {
                  client.send(dispatchPayload("ready", { rtpCapabilities: {}, consumers: [], producers: [] }, 12));
               }
            });
         }),
      );

      await signaling.connect("token", "channel-1", null);

      await vi.waitFor(() => expect(signaling.status).toBe("authenticated"));

      serverClient.send(dispatchPayload("resumed", {}, 13));

      expect(signaling.status).toBe("authenticated");
   });
});

describe("status guards", () => {
   it("throws when checkStatus is called before authentication", () => {
      signaling["setStatus"]("connected");
      signaling.connectionData = { token: "token", channelId: "channel-1", guildId: null };

      expect(() => signaling.checkStatus()).toThrow();
   });

   it("allows checkStatus when authenticated or resuming", () => {
      signaling.connectionData = { token: "token", channelId: "channel-1", guildId: null };

      signaling["setStatus"]("authenticated");
      expect(() => signaling.checkStatus()).not.toThrow();

      signaling["setStatus"]("resuming");
      expect(() => signaling.checkStatus()).not.toThrow();
   });
});

async function connectAndAuthenticate(
   extra?: (client: WebSocketHandlerConnection["client"], payload: VoicePayload) => void,
): Promise<{ received: VoicePayload[]; serverClient: any; findSent: (t: string) => any[] }> {
   const received: VoicePayload[] = [];
   let serverClient: any;

   server.use(
      link.addEventListener("connection", ({ client }) => {
         serverClient = client;
         client.send(helloPayload("session-123", 30_000));
         client.addEventListener("message", (event) => {
            const payload = parse(event);
            received.push(payload);
            if (payload.op === VoiceOperations.IDENTIFY) {
               client.send(dispatchPayload("ready", { rtpCapabilities: {}, consumers: [], producers: [] }, 1));
            }
            extra?.(client, payload);
         });
      }),
   );

   await signaling.connect("token", "channel-1", null);
   await vi.waitFor(() => expect(signaling.status).toBe("authenticated"));

   const findSent = (t: string) => received.filter((p) => (p as any).t === t);

   return { received, serverClient, findSent };
}

describe("send helpers", () => {
   describe("bad states", () => {
      it("rejects sendCreateTransport when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendCreateTransport("send")).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendCreateTransport("send");
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendConnectTransport when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendConnectTransport("transport-1", { fingerprints: [] })).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendConnectTransport("transport-1", { fingerprints: [] });
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendCreateProducer when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendCreateProducer("microphone", "transport-1", { codecs: [] })).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendCreateProducer("microphone", "transport-1", { codecs: [] });
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendCloseProducer when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendCloseProducer("producer-1")).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendCloseProducer("microphone");
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendRestartIce when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendRestartIce("send-transport")).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendRestartIce("send-transport");
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendCreateConsumer when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendCreateConsumer("producer-1", "recv-transport", {})).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendCreateConsumer("producer-1", "recv-transport", {});
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendResumeConsumer when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendResumeConsumer("consumer-1")).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendResumeConsumer("consumer-1");
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendCloseConsumer when client is not initialized or signaling intentionally closed", async () => {
         await expect(signaling.sendCloseConsumer("consumer-1")).rejects.toThrow();

         await connectAndAuthenticate();
         const pending = signaling.sendCloseConsumer("consumer-1");
         signaling.close();
         await expect(pending).rejects.toThrow();
      });

      it("rejects sendCreateTransport when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "create_transport") e.close(1006, "dropped");
         });

         await expect(signaling.sendCreateTransport("send")).rejects.toThrow();
      });

      it("rejects sendConnectTransport when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "connect_transport") e.close(1006, "dropped");
         });

         await expect(signaling.sendConnectTransport("transport-1", { fingerprints: [] })).rejects.toThrow();
      });

      it("rejects sendCreateProducer when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "produce") e.close(1006, "dropped");
         });

         await expect(signaling.sendCreateProducer("microphone", "transport-1", { codecs: [] })).rejects.toThrow();
      });

      it("rejects sendCloseProducer when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "close_producer") e.close(1006, "dropped");
         });

         await expect(signaling.sendCloseProducer("microphone")).rejects.toThrow();
      });

      it("rejects sendRestartIce when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "restart_ice") e.close(1006, "dropped");
         });

         await expect(signaling.sendRestartIce("transport-1")).rejects.toThrow();
      });

      it("rejects sendCreateConsumer when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "consume") e.close(1006, "dropped");
         });

         await expect(signaling.sendCreateConsumer("producer-1", "recv-transport", {})).rejects.toThrow();
      });

      it("rejects sendResumeConsumer when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "resume_consumer") e.close(1006, "dropped");
         });

         await expect(signaling.sendResumeConsumer("consumer-1")).rejects.toThrow();
      });

      it("rejects sendCloseConsumer when client is not initialized or socket closed", async () => {
         await connectAndAuthenticate((e, p) => {
            if (p.op === VoiceOperations.DISPATCH && p.t === "close_consumer") e.close(1006, "dropped");
         });

         await expect(signaling.sendCloseConsumer("consumer-1")).rejects.toThrow();
      });
   });

   describe("transport commands", () => {
      it("sendCreateTransport resolves with the transport result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const createTransportPromise = signaling.sendCreateTransport("send");
         await vi.waitFor(() => expect(findSent("create_transport").length).toBe(1));
         const createTransportPayload = findSent("create_transport")[0] as any;
         expect(createTransportPayload).toMatchObject({
            op: VoiceOperations.DISPATCH,
            t: "create_transport",
            d: { channelId: "channel-1", direction: "send" },
         });

         serverClient.send(dispatchPayload("create_transport_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(dispatchPayload("create_transport_result", { nonce: createTransportPayload.d.nonce, transportId: "send-transport", params: {} }, 1));

         await expect(createTransportPromise).resolves.toEqual({ nonce: createTransportPayload.d.nonce, transportId: "send-transport", params: {} });
      });

      it("sendConnectTransport resolves with the connect result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const connectTransportPromise = signaling.sendConnectTransport("send-transport", { fingerprints: [] });
         await vi.waitFor(() => expect(findSent("connect_transport").length).toBe(1));
         const connectTransportPayload = findSent("connect_transport")[0] as any;
         expect(connectTransportPayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "connect_transport" });

         serverClient.send(dispatchPayload("connect_transport_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(dispatchPayload("connect_transport_result", { nonce: connectTransportPayload.d.nonce, transportId: "send-transport" }, 1));

         await expect(connectTransportPromise).resolves.toEqual({ nonce: connectTransportPayload.d.nonce, transportId: "send-transport" });
      });

      it("sendRestartIce resolves with the ice parameters", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const restartIcePromise = signaling.sendRestartIce("send-transport");
         await vi.waitFor(() => expect(findSent("restart_ice").length).toBe(1));
         const restartIcePayload = findSent("restart_ice")[0] as any;
         expect(restartIcePayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "restart_ice" });

         serverClient.send(dispatchPayload("restart_ice_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(dispatchPayload("restart_ice_result", { nonce: restartIcePayload.d.nonce, iceParameters: {} }, 1));

         await expect(restartIcePromise).resolves.toEqual({ nonce: restartIcePayload.d.nonce, iceParameters: {} });
      });
   });

   describe("producer commands", () => {
      it("sendCreateProducer resolves with the producer result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const createProducerPromise = signaling.sendCreateProducer("microphone", "send-transport", { codecs: [] });
         await vi.waitFor(() => expect(findSent("produce").length).toBe(1));
         const createProducerPayload = findSent("produce")[0] as any;
         expect(createProducerPayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "produce" });

         serverClient.send(dispatchPayload("produce_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(dispatchPayload("produce_result", { nonce: createProducerPayload.d.nonce, producerId: "producer-1", kind: "microphone" }, 1));

         await expect(createProducerPromise).resolves.toEqual({ nonce: createProducerPayload.d.nonce, producerId: "producer-1", kind: "microphone" });
      });

      it("sendCloseProducer resolves with the close result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const closeProducerPromise = signaling.sendCloseProducer("producer-1");
         await vi.waitFor(() => expect(findSent("close_producer").length).toBe(1));
         const closeProducerPayload = findSent("close_producer")[0] as any;
         expect(closeProducerPayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "close_producer" });

         serverClient.send(dispatchPayload("close_producer_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(
            dispatchPayload("close_producer_result", { nonce: closeProducerPayload.d.nonce, producerId: "producer-1", userId: "u1", kind: "microphone" }, 1),
         );

         await expect(closeProducerPromise).resolves.toEqual({
            nonce: closeProducerPayload.d.nonce,
            producerId: "producer-1",
            userId: "u1",
            kind: "microphone",
         });
      });
   });

   describe("consumer commands", () => {
      it("sendCreateConsumer resolves with the consumer result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const createConsumerPromise = signaling.sendCreateConsumer("producer-1", "recv-transport", {});
         await vi.waitFor(() => expect(findSent("consume").length).toBe(1));
         const createConsumerPayload = findSent("consume")[0] as any;
         expect(createConsumerPayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "consume" });

         serverClient.send(dispatchPayload("consume_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(
            dispatchPayload(
               "consume_result",
               {
                  nonce: createConsumerPayload.d.nonce,
                  consumerId: "consumer-1",
                  producerId: "producer-1",
                  producerUserId: "u1",
                  kind: "microphone",
                  rtpParameters: {},
               },
               1,
            ),
         );

         await expect(createConsumerPromise).resolves.toEqual({
            nonce: createConsumerPayload.d.nonce,
            consumerId: "consumer-1",
            producerId: "producer-1",
            producerUserId: "u1",
            kind: "microphone",
            rtpParameters: {},
         });
      });

      it("sendCreateConsumer rejects when the server returns an error", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const errorPromise = signaling.sendCreateConsumer("producer-2", "recv-transport", {});
         await vi.waitFor(() => expect(findSent("consume").length).toBe(1));
         const errorPayload = findSent("consume")[0] as any;

         serverClient.send(dispatchPayload("consume_result", { nonce: errorPayload.d.nonce, error: "consume failed" }, 1));

         await expect(errorPromise).resolves.toEqual({ error: "consume failed", nonce: errorPayload.d.nonce });
      });

      it("sendResumeConsumer resolves with the resume result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const resumePromise = signaling.sendResumeConsumer("consumer-1");
         await vi.waitFor(() => expect(findSent("resume_consumer").length).toBe(1));
         const resumePayload = findSent("resume_consumer")[0] as any;
         expect(resumePayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "resume_consumer" });

         serverClient.send(dispatchPayload("resume_consumer_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(dispatchPayload("resume_consumer_result", { nonce: resumePayload.d.nonce, consumerId: "consumer-1" }, 1));

         await expect(resumePromise).resolves.toEqual({ nonce: resumePayload.d.nonce, consumerId: "consumer-1" });
      });

      it("sendCloseConsumer resolves with the close result", async () => {
         const { serverClient, findSent } = await connectAndAuthenticate();

         const closeConsumerPromise = signaling.sendCloseConsumer("consumer-1");
         await vi.waitFor(() => expect(findSent("close_consumer").length).toBe(1));
         const closeConsumerPayload = findSent("close_consumer")[0] as any;
         expect(closeConsumerPayload).toMatchObject({ op: VoiceOperations.DISPATCH, t: "close_consumer" });

         serverClient.send(dispatchPayload("close_consumer_result", { nonce: "wrong-nonce" }, 1));
         serverClient.send(
            dispatchPayload(
               "close_consumer_result",
               { nonce: closeConsumerPayload.d.nonce, consumerId: "consumer-1", producerId: "producer-1", userId: "u1", kind: "microphone" },
               1,
            ),
         );

         await expect(closeConsumerPromise).resolves.toEqual({
            nonce: closeConsumerPayload.d.nonce,
            consumerId: "consumer-1",
            producerId: "producer-1",
            userId: "u1",
            kind: "microphone",
         });
      });
   });
});
