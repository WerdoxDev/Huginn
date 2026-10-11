import { analytics, GatewayCode, SpanStatusCode } from "@huginnjs/shared";
import { BrowserWindow, ipcMain } from "electron";

type TraceAttributes = Record<string, string | number | boolean>;

function connectionAttributes(name: string, url: string): TraceAttributes {
   const attributes: TraceAttributes = { "websocket.name": name };
   try {
      const endpoint = new URL(url);
      attributes["server.address"] = endpoint.hostname;
      attributes["server.port"] = Number(endpoint.port || (endpoint.protocol === "wss:" ? 443 : 80));
      attributes["url.scheme"] = endpoint.protocol.slice(0, -1);
      attributes["url.path"] = endpoint.pathname;
   } catch {
      attributes["websocket.url_invalid"] = true;
   }
   return attributes;
}

function errorAttributes(error: unknown, prefix = "websocket.error", depth = 0, seen = new Set<object>()): TraceAttributes {
   const attributes: TraceAttributes = {};
   if (error === null || error === undefined || depth > 3) return attributes;
   if (typeof error !== "object") {
      attributes[prefix] = String(error);
      return attributes;
   }
   if (seen.has(error)) return attributes;
   seen.add(error);

   const keys = new Set([
      "name",
      "message",
      "stack",
      "cause",
      "code",
      "errno",
      "syscall",
      "address",
      "port",
      "status",
      "statusText",
      ...Object.getOwnPropertyNames(error),
   ]);
   for (const key of keys) {
      let value: unknown;
      try {
         value = Reflect.get(error, key);
      } catch {
         continue;
      }
      if (key === "cause") {
         Object.assign(attributes, errorAttributes(value, `${prefix}.cause`, depth + 1, seen));
      } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
         attributes[`${prefix}.${key}`] = value;
      }
   }
   return attributes;
}

export class ElectronWebSocket {
   private sockets: Map<string, WebSocket> = new Map();
   private closeRequests = new Map<string, { code?: number; reason?: string; readyState: number }>();

   public registerEvents(window: BrowserWindow) {
      ipcMain.on("ws:connect", (_event, data: { url: string; name: string }) => {
         const previous = this.sockets.get(data.name);
         if (previous) {
            this.sockets.delete(data.name);
            this.closeRequests.delete(data.name);
            previous.close();
         }

         const baseAttributes = connectionAttributes(data.name, data.url);
         const startedAt = performance.now();
         let openedAt: number | undefined;
         let lastError: TraceAttributes | undefined;
         let lastException: Error | undefined;

         const reportError = (error: unknown, eventMessage: string, phase: string, readyState: number) => {
            const details: TraceAttributes = {
               "websocket.error.phase": phase,
               "websocket.error.ready_state": readyState,
               ...errorAttributes(error),
            };
            const message = eventMessage || String(details["websocket.error.message"] || details["websocket.error"] || "WebSocket connection error");
            details["websocket.error.message"] = message;
            lastError = details;
            lastException = error instanceof Error ? error : undefined;

            analytics.startActiveSpan("electronWebSocket.error", (span) => {
               span.setAttributes({ ...baseAttributes, ...details });
               if (error instanceof Error) span.recordException(error);
               span.setStatus({ code: SpanStatusCode.ERROR, message });
            });
            window.webContents.send(`ws:error:${data.name}`, message, details);
         };

         const reportClose = (code: number, reason: string, wasClean: boolean, readyState: number) => {
            const request = this.closeRequests.get(data.name);
            this.closeRequests.delete(data.name);
            this.sockets.delete(data.name);

            const details: TraceAttributes = {
               ...baseAttributes,
               "websocket.close.code": code,
               "websocket.close.reason": reason,
               "websocket.close.was_clean": wasClean,
               "websocket.close.ready_state": readyState,
               "websocket.close.client_requested": Boolean(request),
               "websocket.close.opened": openedAt !== undefined,
               "websocket.close.since_connect_ms": performance.now() - startedAt,
               ...(openedAt !== undefined && { "websocket.close.since_open_ms": performance.now() - openedAt }),
               ...(request?.code !== undefined && { "websocket.close.requested_code": request.code }),
               ...(request?.reason !== undefined && { "websocket.close.requested_reason": request.reason }),
               ...(request && { "websocket.close.requested_ready_state": request.readyState }),
               ...lastError,
            };

            analytics.startActiveSpan("electronWebSocket.close", (span) => {
               span.setAttributes(details);
               if (lastException) span.recordException(lastException);
               const intentionalClose = request?.code === GatewayCode.INTENTIONAL_CLOSE;
               if (!wasClean || lastError || (!intentionalClose && code !== 1000 && code !== 1001)) {
                  span.setStatus({
                     code: SpanStatusCode.ERROR,
                     message: String(lastError?.["websocket.error.message"] || reason || `WebSocket closed with code ${code}`),
                  });
               }
            });
            window.webContents.send(`ws:close:${data.name}`, code, reason, wasClean);
         };

         let socket: WebSocket;
         try {
            socket = new WebSocket(data.url);
         } catch (error) {
            reportError(error, error instanceof Error ? error.message : String(error), "constructor", WebSocket.CLOSED);
            reportClose(1006, "", false, WebSocket.CLOSED);
            return;
         }
         socket.binaryType = "arraybuffer";
         this.sockets.set(data.name, socket);

         socket.addEventListener("open", () => {
            if (this.sockets.get(data.name) !== socket) return;
            const openTime = performance.now();
            openedAt = openTime;
            analytics.startActiveSpan("electronWebSocket.open", (span) => {
               span.setAttributes({
                  ...baseAttributes,
                  "websocket.open.ready_state": socket.readyState,
                  "websocket.open.connect_duration_ms": openTime - startedAt,
               });
            });
            window.webContents.send(`ws:open:${data.name}`);
         });

         socket.addEventListener("close", (event) => {
            if (this.sockets.get(data.name) !== socket) return;
            reportClose(event.code, event.reason, event.wasClean, socket.readyState);
         });

         socket.addEventListener("error", (event) => {
            if (this.sockets.get(data.name) !== socket) return;
            const errorEvent = event as ErrorEvent;
            reportError(errorEvent.error, errorEvent.message, "socket", socket.readyState);
         });

         socket.addEventListener("message", (event) => {
            if (this.sockets.get(data.name) !== socket) return;
            window.webContents.send(`ws:message:${data.name}`, event.data);
         });
      });

      ipcMain.on("ws:send", (_event, data: { name: string; data: any }) => {
         const socket = this.sockets.get(data.name);
         if (socket?.readyState === WebSocket.OPEN) {
            socket.send(data.data);
         }
      });

      ipcMain.on("ws:disconnect", (_event, data: { name: string; code?: number; reason?: string }) => {
         const socket = this.sockets.get(data.name);
         if (socket) {
            this.closeRequests.set(data.name, { code: data.code, reason: data.reason, readyState: socket.readyState });
            socket.close(data.code, data.reason);
         }
      });
   }
}
