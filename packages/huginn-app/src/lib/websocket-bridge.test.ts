import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebSocketBridge } from "./websocket-bridge";

type Listener = (...args: any[]) => void;

describe("WebSocketBridge", () => {
   const listeners = new Map<string, Listener>();
   const connectWebSocket = vi.fn();
   const disconnectWebSocket = vi.fn();
   const websocketSend = vi.fn();

   beforeEach(() => {
      listeners.clear();
      connectWebSocket.mockClear();
      disconnectWebSocket.mockClear();
      websocketSend.mockClear();

      const listen = (type: string) => (name: string, callback: Listener) => {
         const key = `${type}:${name}`;
         listeners.set(key, callback);
         return () => listeners.delete(key);
      };

      window.electronAPI = {
         connectWebSocket,
         disconnectWebSocket,
         websocketSend,
         onWebSocketOpen: listen("open"),
         onWebSocketClose: listen("close"),
         onWebSocketError: listen("error"),
         onWebSocketMessage: listen("message"),
      } as unknown as typeof window.electronAPI;
   });

   it("connects on construction and forwards WebSocket handlers and message data", () => {
      const socket = new WebSocketBridge("gateway", "wss://example.test/gateway");
      const name = connectWebSocket.mock.calls[0][0];
      const onopen = vi.fn();
      const onmessage = vi.fn();
      const addEventListener = vi.fn();
      socket.onopen = onopen;
      socket.onmessage = onmessage;
      socket.addEventListener("message", addEventListener);

      expect(socket.readyState).toBe(WebSocket.CONNECTING);
      expect(connectWebSocket).toHaveBeenCalledWith(name, socket.url);
      expect(() => socket.send("early")).toThrow(DOMException);

      listeners.get(`open:${name}`)?.();
      listeners.get(`message:${name}`)?.(undefined, '{"op":10}');

      expect(socket.readyState).toBe(WebSocket.OPEN);
      expect(onopen).toHaveBeenCalledOnce();
      expect(onmessage.mock.calls[0][0].data).toBe('{"op":10}');
      expect(addEventListener.mock.calls[0][0].data).toBe('{"op":10}');
      socket.send("outbound");
      expect(websocketSend).toHaveBeenCalledWith(name, "outbound");
   });

   it("passes close codes, updates state, and removes IPC listeners", () => {
      const socket = new WebSocketBridge("gateway", "wss://example.test/gateway");
      const name = connectWebSocket.mock.calls[0][0];
      const onclose = vi.fn();
      socket.onclose = onclose;
      listeners.get(`open:${name}`)?.();

      socket.close(4000, "timeout");
      expect(socket.readyState).toBe(WebSocket.CLOSING);
      expect(disconnectWebSocket).toHaveBeenCalledWith(name, 4000, "timeout");

      listeners.get(`close:${name}`)?.(undefined, 4000, "timeout", true);
      expect(socket.readyState).toBe(WebSocket.CLOSED);
      expect(onclose.mock.calls[0][0]).toMatchObject({ code: 4000, reason: "timeout", wasClean: true });
      expect([...listeners.keys()].filter((key) => key.endsWith(`:${name}`))).toEqual([]);
   });

   it("uses separate channels for successive sockets", () => {
      new WebSocketBridge("gateway", "wss://example.test/gateway");
      new WebSocketBridge("gateway", "wss://example.test/gateway");
      expect(connectWebSocket.mock.calls[0][0]).not.toBe(connectWebSocket.mock.calls[1][0]);
   });

   it("exposes the main-process error details to error handlers", () => {
      const socket = new WebSocketBridge("gateway", "wss://example.test/gateway");
      const name = connectWebSocket.mock.calls[0][0];
      const onerror = vi.fn();
      socket.onerror = onerror;
      const details = { "websocket.error.message": "handshake failed", "websocket.error.cause.code": "ECONNREFUSED" };

      listeners.get(`error:${name}`)?.(undefined, "handshake failed", details);

      expect(onerror.mock.calls[0][0]).toMatchObject({ message: "handshake failed", error: details });
   });
});
