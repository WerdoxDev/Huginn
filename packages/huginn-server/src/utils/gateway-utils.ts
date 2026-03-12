import { gateway } from "#setup";
// import { logGatewaySend } from "@huginn/backend-shared";
import { type GatewayWebsocketEvents, GatewayOperations, type GatewayPayload } from "@huginn/shared";

export function dispatchToTopic<K extends keyof GatewayWebsocketEvents>(topics: string | string[], t: K, d: GatewayWebsocketEvents[K]) {
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
