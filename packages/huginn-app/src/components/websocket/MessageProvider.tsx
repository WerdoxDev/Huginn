import { useClient } from "@contexts/apiContext";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { APIGetChannelMessagesResult, APIGetUserChannelsResult } from "@huginn/shared";
import { GatewayMessageCreateDispatchData } from "@huginn/shared";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

export default function MessageProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const mutation = useCreateDMChannel();

   useEffect(() => {
      client.gateway.on("message_create", onMessageCreated);

      return () => {
         client.gateway.off("message_create", onMessageCreated);
      };
   }, []);

   function onMessageCreated(d: GatewayMessageCreateDispatchData) {
      console.log(`HI ${d.channelId}`);

      const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
      const thisChannelIndex = channels?.findIndex(x => x.id === d.channelId) ?? -1;
      const thisChannel = channels?.find(x => x.id === d.channelId);
      if (!thisChannel) {
         mutation.mutate({ userId: d.author.id, skipNavigation: true });
         return;
      }

      queryClient.setQueryData<InfiniteData<APIGetChannelMessagesResult, { before: string; after: string }>>(
         ["messages", d.channelId],
         data => {
            if (!data) return undefined;

            const lastPage = data.pages[data.pages.length - 1];
            const lastParams = data.pageParams[data.pageParams.length - 1];
            if (!lastParams.before && (!lastParams.after || lastPage.some(x => x.id === thisChannel.lastMessageId))) {
               console.log("HI?");
               return {
                  ...data,
                  pages: [...data.pages.toSpliced(data.pages.length - 1, 1, [...lastPage, d])],
               };
            }

            return data;
         },
      );

      queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], data => {
         console.log(thisChannelIndex);
         if (!data || thisChannelIndex === -1) return undefined;
         console.log(...data.toSpliced(thisChannelIndex, 1, { ...thisChannel, lastMessageId: d.id }));
         return [...data.toSpliced(thisChannelIndex, 1, { ...thisChannel, lastMessageId: d.id })];
      });

      // queryClient.setQueryData(["channels", "@me"], (previous: APIGetUserChannelsResult) => [newChannel, ...previous]);
   }

   return props.children;
}
