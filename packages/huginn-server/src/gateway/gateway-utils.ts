import { BasePayload, GatewayOperations } from "@huginn/shared";
import { logGatewaySend } from "../log-utils";
import { gateway } from "../server";

export function publishToTopic(topic: string, data: BasePayload) {
   logGatewaySend(data, false);

   gateway.sendToTopic(topic, data);
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
