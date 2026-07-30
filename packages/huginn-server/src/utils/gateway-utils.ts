// import { logGatewaySend } from "@huginn/backend-shared";
import { type GatewayWebsocketEvents, GatewayOperations, type GatewayPayload, analytics } from "@huginnjs/shared";

import { gateway } from "#server";

export function dispatchToTopic<K extends keyof GatewayWebsocketEvents>(topics: string | string[], t: K, d: GatewayWebsocketEvents[K]) {
   analytics.startActiveSpan("gateway.dispatchToTopic", (span) => {
      span.setAttributes({
         "params.topic.count": Array.isArray(topics) ? topics.length : 1,
         "params.event.type": t,
      });

      try {
         const data = { op: GatewayOperations.DISPATCH, t, d, s: 0 } as GatewayPayload;

         if (Array.isArray(topics)) {
            for (const topic of topics) {
               gateway.sendToTopic(topic, data);
            }
         } else {
            gateway.sendToTopic(topics, data);
         }
      } catch (e) {
         span.recordException(e as Error);
         throw e;
      } finally {
         span.end();
      }
   });
}
