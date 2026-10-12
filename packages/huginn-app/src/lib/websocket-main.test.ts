import { analyticsShim, initAnalytics, SpanStatusCode, type Analytics } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ElectronWebSocket } from "../../electron/websocket";

const handlers = vi.hoisted(() => new Map<string, (...args: any[]) => void>());

vi.mock("electron", () => ({
   ipcMain: {
      on: (channel: string, handler: (...args: any[]) => void) => handlers.set(channel, handler),
   },
}));

describe("ElectronWebSocket", () => {
   const sockets: FakeWebSocket[] = [];
   const sendToRenderer = vi.fn();
   const spans: Array<{ name: string; attributes: Record<string, unknown>; status?: { code: number; message?: string }; exceptions: unknown[] }> = [];

   class FakeWebSocket extends EventTarget {
      public static readonly OPEN = 1;
      public binaryType: BinaryType = "blob";
      public readyState = 0;
      public send = vi.fn();
      public close = vi.fn((code?: number, reason?: string) => {
         this.readyState = 3;
         this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean: true }));
      });

      public constructor(public readonly url: string) {
         super();
         sockets.push(this);
      }
   }

   beforeEach(() => {
      sockets.length = 0;
      spans.length = 0;
      handlers.clear();
      sendToRenderer.mockClear();
      initAnalytics({
         startActiveSpan(name: string, callback: (span: any) => unknown) {
            const recorded: (typeof spans)[number] = { name, attributes: {}, exceptions: [] };
            spans.push(recorded);
            return callback({
               setAttributes: (attributes: Record<string, unknown>) => Object.assign(recorded.attributes, attributes),
               setStatus: (status: { code: number; message?: string }) => (recorded.status = status),
               recordException: (error: unknown) => recorded.exceptions.push(error),
            });
         },
      } as unknown as Analytics);
      vi.stubGlobal("WebSocket", FakeWebSocket);
      new ElectronWebSocket().registerEvents({ webContents: { send: sendToRenderer } } as any);
   });

   afterEach(() => initAnalytics(analyticsShim));

   it("relays message data and close details through IPC", () => {
      handlers.get("ws:connect")?.(undefined, { name: "gateway:1", url: "wss://example.test/gateway" });
      const socket = sockets[0];
      expect(socket.binaryType).toBe("arraybuffer");

      socket.readyState = FakeWebSocket.OPEN;
      socket.dispatchEvent(new Event("open"));
      socket.dispatchEvent(new MessageEvent("message", { data: '{"op":10}' }));
      handlers.get("ws:send")?.(undefined, { name: "gateway:1", data: "outbound" });
      handlers.get("ws:disconnect")?.(undefined, { name: "gateway:1", code: 4000, reason: "timeout" });

      expect(sendToRenderer).toHaveBeenCalledWith("ws:open:gateway:1");
      expect(sendToRenderer).toHaveBeenCalledWith("ws:message:gateway:1", '{"op":10}');
      expect(socket.send).toHaveBeenCalledWith("outbound");
      expect(socket.close).toHaveBeenCalledWith(4000, "timeout");
      expect(sendToRenderer).toHaveBeenCalledWith("ws:close:gateway:1", 4000, "timeout", true);
      expect(spans.map((span) => span.name)).toEqual(["electronWebSocket.open", "electronWebSocket.close"]);
      expect(spans[1].attributes).toMatchObject({
         "websocket.close.code": 4000,
         "websocket.close.reason": "timeout",
         "websocket.close.requested_code": 4000,
         "websocket.close.requested_reason": "timeout",
         "websocket.close.was_clean": true,
      });
   });

   it("closes a replaced socket and ignores its late events", () => {
      handlers.get("ws:connect")?.(undefined, { name: "gateway:1", url: "wss://example.test/old" });
      const oldSocket = sockets[0];
      oldSocket.close = vi.fn(() => {
         oldSocket.readyState = 3;
      });

      handlers.get("ws:connect")?.(undefined, { name: "gateway:1", url: "wss://example.test/new" });
      const newSocket = sockets[1];
      expect(oldSocket.close).toHaveBeenCalledOnce();

      oldSocket.dispatchEvent(new Event("open"));
      oldSocket.dispatchEvent(new MessageEvent("message", { data: "stale" }));
      oldSocket.dispatchEvent(new ErrorEvent("error", { message: "stale error" }));
      oldSocket.dispatchEvent(new CloseEvent("close", { code: 1000, wasClean: true }));

      newSocket.readyState = FakeWebSocket.OPEN;
      newSocket.dispatchEvent(new Event("open"));
      handlers.get("ws:send")?.(undefined, { name: "gateway:1", data: "current" });
      expect(newSocket.send).toHaveBeenCalledWith("current");
      expect(sendToRenderer.mock.calls).toEqual([["ws:open:gateway:1"]]);

      handlers.get("ws:disconnect")?.(undefined, { name: "gateway:1", code: 4000 });
      expect(newSocket.close).toHaveBeenCalledWith(4000, undefined);
      expect(sendToRenderer).toHaveBeenCalledWith("ws:close:gateway:1", 4000, "", true);
   });

   it("keeps the underlying error and cause on both error and close spans", () => {
      handlers.get("ws:connect")?.(undefined, { name: "gateway:2", url: "wss://example.test/gateway?token=secret" });
      const socket = sockets[0];
      const cause = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
      const error = new Error("WebSocket handshake failed", { cause });

      socket.dispatchEvent(new ErrorEvent("error", { error }));
      socket.dispatchEvent(new CloseEvent("close", { code: 1006, wasClean: false }));

      expect(sendToRenderer).toHaveBeenCalledWith(
         "ws:error:gateway:2",
         "WebSocket handshake failed",
         expect.objectContaining({ "websocket.error.cause.code": "ECONNREFUSED" }),
      );
      expect(spans.map((span) => span.name)).toEqual(["electronWebSocket.error", "electronWebSocket.close"]);
      expect(spans[0].exceptions).toEqual([error]);
      expect(spans[0].status?.code).toBe(SpanStatusCode.ERROR);
      expect(spans[1].exceptions).toEqual([error]);
      expect(spans[1].attributes).toMatchObject({
         "websocket.close.code": 1006,
         "websocket.close.was_clean": false,
         "websocket.error.message": "WebSocket handshake failed",
         "websocket.error.cause.code": "ECONNREFUSED",
         "url.path": "/gateway",
      });
      expect(spans[1].attributes).not.toHaveProperty("url.query");
      expect(spans[1].status?.code).toBe(SpanStatusCode.ERROR);
   });

   it("traces construction failures as an abnormal close", () => {
      vi.stubGlobal(
         "WebSocket",
         class {
            public static readonly CLOSED = 3;
            public constructor() {
               throw Object.assign(new TypeError("Invalid WebSocket URL"), { code: "ERR_INVALID_URL" });
            }
         },
      );

      handlers.get("ws:connect")?.(undefined, { name: "gateway:3", url: "invalid" });

      expect(spans.map((span) => span.name)).toEqual(["electronWebSocket.error", "electronWebSocket.close"]);
      expect(spans[0].attributes).toMatchObject({ "websocket.error.phase": "constructor", "websocket.error.code": "ERR_INVALID_URL" });
      expect(spans[1].attributes).toMatchObject({ "websocket.close.code": 1006, "websocket.close.opened": false });
      expect(sendToRenderer).toHaveBeenCalledWith("ws:close:gateway:3", 1006, "", false);
   });
});
