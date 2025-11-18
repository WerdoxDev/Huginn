import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { Gateway } from "../gateway";
import { GatewayOperations, GatewayCode } from "@huginn/shared";
import type { HuginnClient } from "../";
import type { GatewayOptions } from "../types";

// Mock WebSocket
class MockWebSocket {
   public readyState: number = WebSocket.CONNECTING;
   public onopen?: () => void;
   public onclose?: (e: CloseEvent) => void;
   public onmessage?: (e: MessageEvent) => void;
   public onerror?: (e: Event) => void;

   public sentMessages: string[] = [];

   constructor(public url: string) {}

   send(data: string) {
      this.sentMessages.push(data);
   }

   close(code?: number) {
      this.readyState = WebSocket.CLOSED;
      const event = new CloseEvent("close", { code: code || 1000 });
      this.onclose?.(event);
   }

   simulateOpen() {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
   }

   simulateMessage(data: any) {
      const event = new MessageEvent("message", { data: JSON.stringify(data) });
      this.onmessage?.(event);
   }
}

// Mock client
const createMockClient = (): HuginnClient =>
   ({
      tokenHandler: {
         token: "test-token-123",
      },
   }) as any;

describe("Gateway", () => {
   let gateway: Gateway;
   let mockClient: HuginnClient;
   let mockSocket: MockWebSocket;
   let createSocketMock: any;

   beforeEach(() => {
      mockClient = createMockClient();
      createSocketMock = mock((url: string) => {
         mockSocket = new MockWebSocket(url);
         return mockSocket as any;
      });

      const options: Partial<GatewayOptions> = {
         url: "wss://test.gateway.com",
         createSocket: createSocketMock,
         intents: 123,
      };

      gateway = new Gateway(mockClient, options);
   });

   afterEach(() => {
      gateway.close();
   });

   describe("connect()", () => {
      test("should establish websocket connection", () => {
         gateway.connect();

         expect(createSocketMock).toHaveBeenCalledWith("wss://test.gateway.com");
         expect(gateway.status).toBe("connecting");
         expect(gateway.socket).toBeDefined();
      });

      test("should throw error if already connecting", () => {
         gateway.connect();

         expect(() => gateway.connect()).toThrow("Socket is already connected or is connecting");
      });

      test("should emit connected event on websocket open", () => {
         const connectedSpy = mock(() => {});
         gateway.listen("connected", connectedSpy);

         gateway.connect();
         mockSocket.simulateOpen();

         expect(connectedSpy).toHaveBeenCalled();
         expect(gateway.status).toBe("connected");
      });
   });

   describe("close()", () => {
      test("should close websocket with intentional close code", () => {
         gateway.connect();
         mockSocket.simulateOpen();

         const closeSpy = mock((code: number) => {});
         gateway.listen("disconnected", closeSpy);

         gateway.close();

         expect(closeSpy).toHaveBeenCalledWith(GatewayCode.INTENTIONAL_CLOSE);
         expect(gateway.status).toBe("disconnected");
      });
   });

   describe("authenticate()", () => {
      test("should send identify when no session exists", async () => {
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         const authPromise = gateway.authenticate();

         // Wait for identify to be sent
         await new Promise((resolve) => setTimeout(resolve, 10));

         const identifyMessage = JSON.parse(mockSocket.sentMessages[0]);
         expect(identifyMessage.op).toBe(GatewayOperations.IDENTIFY);
         expect(identifyMessage.d.token).toBe("test-token-123");

         // Simulate ready event
         mockSocket.simulateMessage({
            op: GatewayOperations.DISPATCH,
            t: "ready",
            s: 1,
            d: { user: { id: "user-123", username: "testuser" } },
         });

         const result = await authPromise;
         expect(result.authenticated).toBe(true);
         expect(gateway.isAuthenticated).toBe(true);
      });

      test("should send resume when session exists", async () => {
         // Set up existing session
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 5,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         // Disconnect
         gateway.socket?.close();

         // Reconnect and authenticate
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         const authPromise = gateway.authenticate();
         await new Promise((resolve) => setTimeout(resolve, 10));

         const resumeMessage = JSON.parse(mockSocket.sentMessages[mockSocket.sentMessages.length - 1]);
         expect(resumeMessage.op).toBe(GatewayOperations.RESUME);
         expect(resumeMessage.d.sessionId).toBe("session-123");
         expect(resumeMessage.d.seq).toBe(5);

         mockSocket.simulateMessage({
            op: GatewayOperations.DISPATCH,
            t: "resumed",
            s: 5,
         });

         const result = await authPromise;

         expect(result.authenticated).toBe(true);
      });

      test("should return false if authentication fails", async () => {
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         const authPromise = gateway.authenticate();
         await new Promise((resolve) => setTimeout(resolve, 10));

         // Simulate authentication failure
         mockSocket.close(GatewayCode.AUTHENTICATION_FAILED);

         const result = await authPromise;
         expect(result.authenticated).toBe(false);
         expect(result.retryable).toBe(false);
      });
   });

   describe("getVoiceToken()", () => {
      test("should request voice token and return it", async () => {
         // Setup authenticated gateway
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         const tokenPromise = gateway.getVoiceToken("guild-123", "channel-456");

         // Simulate voice server update
         mockSocket.simulateMessage({
            op: GatewayOperations.DISPATCH,
            t: "voice_server_update",
            s: 2,
            d: { token: "voice-token-789", guildId: "guild-123" },
         });

         // Simulate voice state update
         mockSocket.simulateMessage({
            op: GatewayOperations.DISPATCH,
            t: "voice_state_update",
            s: 3,
            d: {
               userId: "user-123",
               channelId: "channel-456",
               guildId: "guild-123",
            },
         });

         const token = await tokenPromise;
         expect(token).toBe("voice-token-789");
      });
   });

   describe("sendDefaultVoiceState()", () => {
      test("should send voice state update with null channel", async () => {
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         mockSocket.sentMessages = [];
         await gateway.sendDefaultVoiceState();

         const message = JSON.parse(mockSocket.sentMessages[0]);
         expect(message.op).toBe(GatewayOperations.VOICE_STATE_UPDATE);
         expect(message.d.channelId).toBeNull();
         expect(message.d.guildId).toBeNull();
      });
   });

   describe("updateVoiceState()", () => {
      test("should update voice state flags", async () => {
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         mockSocket.sentMessages = [];
         const updatePromise = gateway.updateVoiceState(
            { isAudioMuted: true, isAudioDeafened: false, isAudioStreaming: false, isCameraOn: false, isScreenSharing: false },
            "channel-456",
            "guild-123",
         );

         const message = JSON.parse(mockSocket.sentMessages[0]);
         expect(message.op).toBe(GatewayOperations.VOICE_STATE_UPDATE);
         expect(message.d.isAudioMuted).toBe(true);
         expect(message.d.channelId).toBe("channel-456");

         // Simulate voice state update response
         mockSocket.simulateMessage({
            op: GatewayOperations.DISPATCH,
            t: "voice_state_update",
            s: 2,
            d: {
               userId: "user-123",
               channelId: "channel-456",
               guildId: "guild-123",
               isAudioMuted: true,
            },
         });

         const result = await updatePromise;
         expect(result.isAudioMuted).toBe(true);
      });
   });

   describe("updatePresence()", () => {
      test("should send presence update when authenticated", async () => {
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         mockSocket.sentMessages = [];
         gateway.updatePresence({
            status: "online",
            activities: [{ name: "Testing", type: 0, createdAt: new Date().getTime() }],
         });

         const message = JSON.parse(mockSocket.sentMessages[0]);
         expect(message.op).toBe(GatewayOperations.PRESENCE_UPDATE);
         expect(message.d.status).toBe("online");
         expect(message.d.activities).toHaveLength(1);
      });

      test("should not send presence update when not authenticated", () => {
         gateway.connect();
         mockSocket.simulateOpen();

         mockSocket.sentMessages = [];
         gateway.updatePresence({ status: "online", activities: [] });

         expect(mockSocket.sentMessages).toHaveLength(0);
      });
   });

   describe("status getters", () => {
      test("isConnected should return true when helloed or authenticated", async () => {
         expect(gateway.isConnected).toBe(false);

         gateway.connect();
         mockSocket.simulateOpen();
         expect(gateway.isConnected).toBe(false);

         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });
         expect(gateway.isConnected).toBe(true);

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         expect(gateway.isConnected).toBe(true);
      });

      test("isAuthenticated should return true only when authenticated", async () => {
         expect(gateway.isAuthenticated).toBe(false);

         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });
         expect(gateway.isAuthenticated).toBe(false);

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         expect(gateway.isAuthenticated).toBe(true);
      });
   });

   describe("user getter", () => {
      test("should return undefined before authentication", () => {
         expect(gateway.user).toBeUndefined();
      });

      test("should return user after authentication", async () => {
         gateway.connect();
         mockSocket.simulateOpen();
         mockSocket.simulateMessage({
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: 30000, sessionId: "session-123" },
         });

         await Promise.allSettled([
            gateway.authenticate(),
            mockSocket.simulateMessage({
               op: GatewayOperations.DISPATCH,
               t: "ready",
               s: 1,
               d: { user: { id: "user-123", username: "testuser" } },
            }),
         ]);

         expect(gateway.user).toBeDefined();
         expect(gateway.user?.id).toBe("user-123");
         expect(gateway.user?.username).toBe("testuser");
      });
   });
});
