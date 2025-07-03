// import { logGatewaySend } from "@huginn/backend-shared";
import { type GatewayEvents, GatewayOperations, type GatewayPayload } from "@huginn/shared";
import { gateway } from "#setup";

export function dispatchToTopic<K extends keyof GatewayEvents>(topics: string | string[], t: K, d: GatewayEvents[K]) {
   const data = { op: GatewayOperations.DISPATCH, t, d, s: 0 } as GatewayPayload;

   // logGatewaySend(topics, data, false);

   if (Array.isArray(topics)) {
      for (const topic of topics) {
         gateway.sendToTopic(topic, data);
      }
   } else {
      gateway.sendToTopic(topics, data);
   }
}
