import MessageBox from "@components/MessageBox";
import ModalErrorComponent from "@components/ModalErrorComponent";
import ChannelMessages from "@components/channels/ChannelMessages";
import HomeTopbar from "@components/channels/HomeTopbar";
import { useClient } from "@contexts/apiContext";
import { ensureChannelExists } from "@lib/middlewares";
import { getChannelsOptions, getMessagesOptions } from "@lib/queries";
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
   component: Component,
   beforeLoad({ context: { queryClient }, params }) {
      ensureChannelExists(params.channelId, queryClient);
   },
   loader: async ({ params, context: { queryClient, client } }) => {
      return (
         queryClient.getQueryData(getMessagesOptions(client, params.channelId).queryKey) ??
         (await queryClient.fetchInfiniteQuery(getMessagesOptions(client, params.channelId)))
      );
   },
   gcTime: 0,
   errorComponent: ModalErrorComponent,
});

function Component() {
   const client = useClient();
   const { channelId } = Route.useParams();
   const { data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(client, channelId));
   const channel = useSuspenseQuery(getChannelsOptions(client, "@me")).data?.find((x: { id: string }) => x.id === channelId);

   return (
      <div className="flex h-full flex-col">
         <HomeTopbar channel={channel} />
         <div className="h-0.5 flex-shrink-0 bg-white/10" />
         <ChannelMessages channelId={channelId} messages={messages.pages.flat()} />
         <div className="flex h-16 w-full flex-shrink-0 bg-background">
            <MessageBox />
            <div className="h-full w-64 flex-shrink-0" />
         </div>
      </div>
   );
}