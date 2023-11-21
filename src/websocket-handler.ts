import { ServerWebSocket } from "bun";
import { WebSocketData } from "shared/lib/types";

export function handleMessage(_ws: ServerWebSocket<WebSocketData>, _message: string | Buffer) {}

export function handleOpen(ws: ServerWebSocket<WebSocketData>) {
   console.log(`Client connected with id: ${ws.data.id}, ip: ${ws.remoteAddress}`);
}

export function handleClose(ws: ServerWebSocket<WebSocketData>, code: number, message: string) {
   console.log(`Client disconnected with id: ${ws.data.id}, code: ${code}, message: ${message}`);
}
