import { useClient } from "@contexts/apiContext";
import { useEvent } from "@contexts/eventContext";
import { useUser } from "@contexts/userContext";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { APIGetChannelMessagesResult, APIGetUserChannelsResult } from "@huginn/shared";
import { GatewayMessageCreateData } from "@huginn/shared";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

export default function MessageProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const { user } = useUser();
   const queryClient = useQueryClient();
   const mutation = useCreateDMChannel();
   const { dispatchEvent } = useEvent();

   useEffect(() => {
      client.gateway.on("message_create", onMessageCreated);

      return () => {
         client.gateway.off("message_create", onMessageCreated);
      };
   }, []);

   function onMessageCreated(d: GatewayMessageCreateData) {
      const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
      const thisChannelIndex = channels?.findIndex(x => x.id === d.channelId) ?? -1;
      const thisChannel = channels?.find(x => x.id === d.channelId);

      //TODO: Notification stuff goes here

      if (!thisChannel) {
         mutation.mutate({ userId: d.author.id, skipNavigation: true });
         return;
      }

      let messageVisible = false;

      queryClient.setQueryData<InfiniteData<APIGetChannelMessagesResult, { before: string; after: string }>>(
         ["messages", d.channelId],
         data => {
            if (!data) return undefined;

            const lastPage = data.pages[data.pages.length - 1];
            const lastParams = data.pageParams[data.pageParams.length - 1];
            // See if the message can be appended to the current page
            if (!lastParams.before && (!lastParams.after || lastPage.some(x => x.id === thisChannel.lastMessageId))) {
               messageVisible = true;
               return {
                  ...data,
                  pages: [...data.pages.toSpliced(data.pages.length - 1, 1, [...lastPage, d])],
               };
            }

            return data;
         },
      );

      queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], data => {
         if (!data || thisChannelIndex === -1) return undefined;

         return [...data.toSpliced(thisChannelIndex, 1, { ...thisChannel, lastMessageId: d.id })];
      });

      dispatchEvent("message_added", { message: d, visible: messageVisible, self: d.author.id === user?.id });
   }

   return props.children;
}
