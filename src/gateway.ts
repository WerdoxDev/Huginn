import { constants } from "@shared/constants";
import { BasePayload, GatewayHeartbeatAck, GatewayHello, GatewayOperations } from "@shared/gateway-types";
import { ServerWebSocket } from "bun";
import consola from "consola";
import { isHeartbeatOpcode } from "./gateway-utils";
import { logGatewayRecieve, logGatewaySend } from "./log-utils";

export function gatewayOpen(ws: ServerWebSocket) {
   const data: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
   send(ws, data);
}

export function gatewayMessage(ws: ServerWebSocket, message: string | Buffer) {
   if (typeof message !== "string") {
      consola.error("Non string message type is not supported yet");
      return;
   }

   const data = JSON.parse(message);

   logGatewayRecieve(data);

   if (isHeartbeatOpcode(data)) {
      sendHeartbeatAck(ws);
   }
}

function sendHeartbeatAck(ws: ServerWebSocket) {
   const data: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
   send(ws, data);
}

function send(ws: ServerWebSocket, data: unknown) {
   logGatewaySend(data as BasePayload);

   ws.send(JSON.stringify(data));
}
