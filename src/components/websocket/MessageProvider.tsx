import { useClient } from "@contexts/apiContext";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { APIGetChannelMessagesResult, APIGetUserChannelsResult } from "@shared/api-types";
import { GatewayDispatchEvents, GatewayMessageCreateDispatchData } from "@shared/gateway-types";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

export default function MessageProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const mutation = useCreateDMChannel();

   useEffect(() => {
      client.gateway.on(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);

      return () => {
         client.gateway.off(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);
      };
   }, []);

   function onMessageCreated(d: GatewayMessageCreateDispatchData) {
      console.log(`HI ${d.channelId}`);

      queryClient.setQueryData<APIGetChannelMessagesResult>(["messages", d.channelId], (data) => (data ? [...data, d] : undefined));

      const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
      if (channels?.some((x) => x.id === d.channelId)) return;

      mutation.mutate({ userId: d.author.id, skipNavigation: true });
      // queryClient.setQueryData(["channels", "@me"], (previous: APIGetUserChannelsResult) => [newChannel, ...previous]);
   }

   return props.children;
}
