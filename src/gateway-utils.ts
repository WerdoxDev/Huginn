import { GatewayHeartbeat, GatewayOperations } from "@shared/gateway-types";

export function isHeartbeatOpcode(data: unknown): data is GatewayHeartbeat {
   if (data && typeof data === "object") {
      return "op" in data && data.op === GatewayOperations.HEARTBEAT;
   }

   return false;
}
