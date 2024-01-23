import { GatewayHeartbeat, GatewayIdentify, GatewayOperations } from "@shared/gateway-types";
import { checkOpcode } from "@shared/utility";
import { server } from "../server";

export function isHeartbeatOpcode(data: unknown): data is GatewayHeartbeat {
   return checkOpcode(data, GatewayOperations.HEARTBEAT);
}

export function isIdentifyOpcode(data: unknown): data is GatewayIdentify {
   return checkOpcode(data, GatewayOperations.IDENTIFY);
}

export function publishToTopic(topic: string, data: unknown) {
   server.publish(topic, JSON.stringify(data));
}
