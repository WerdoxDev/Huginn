import { BasePayload, GatewayHeartbeat, GatewayIdentify, GatewayOperations } from "@shared/gateway-types";
import { checkOpcode } from "@shared/utils";
import { server } from "../server";
import { logGatewaySend } from "../log-utils";

export function isHeartbeatOpcode(data: unknown): data is GatewayHeartbeat {
   return checkOpcode(data, GatewayOperations.HEARTBEAT);
}

export function isIdentifyOpcode(data: unknown): data is GatewayIdentify {
   return checkOpcode(data, GatewayOperations.IDENTIFY);
}

export function publishToTopic(topic: string, data: BasePayload) {
   logGatewaySend(data, false);

   server.publish(topic, JSON.stringify(data));
}

export function dispatchToTopic<T extends BasePayload>(topic: string, t: T["t"], d: T["d"], s: T["s"]) {
   publishToTopic(topic, { op: GatewayOperations.DISPATCH, t, d, s });
}

export function validateGatewayData(data: unknown): boolean {
   if (data && typeof data === "object") {
      return "op" in data;
   }

   return false;
}
