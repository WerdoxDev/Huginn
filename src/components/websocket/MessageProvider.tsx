import { ReactNode, useEffect } from "react";
import { useClient } from "@contexts/apiContext";
import { GatewayDispatchEvents, GatewayMessageCreateDispatchData } from "@shared/gateway-types";
import { useQueryClient } from "@tanstack/react-query";
import { APIGetChannelMessagesResult } from "@shared/api-types";

export default function MessageProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();

   useEffect(() => {
      client.gateway.on(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);

      return () => {
         client.gateway.off(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);
      };
   }, []);

   function onMessageCreated(d: GatewayMessageCreateDispatchData) {
      console.log(`HI ${d.channelId}`);

      queryClient.setQueryData(["messages", d.channelId], (data: APIGetChannelMessagesResult) => [...data, d]);
   }

   return props.children;
}
