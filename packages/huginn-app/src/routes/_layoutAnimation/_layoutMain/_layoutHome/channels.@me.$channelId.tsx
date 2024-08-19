import MessageBox from "@components/MessageBox";
import RouteErrorComponent from "@components/RouteErrorComponent";
import ChannelMessages from "@components/channels/ChannelMessages";
import HomeTopbar from "@components/channels/HomeTopbar";
import { useClient } from "@contexts/apiContext";
import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { ensureChannelExists } from "@lib/middlewares";
import { getChannelsOptions, getMessagesOptions } from "@lib/queries";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
   component: Component,
   beforeLoad({ context: { queryClient }, params }) {
      ensureChannelExists(params.channelId, queryClient);
   },
   loader: async ({ params, context: { queryClient, client } }) => {
      return (
         queryClient.getQueryData(getMessagesOptions(queryClient, client, params.channelId).queryKey) ??
         (await queryClient.fetchInfiniteQuery(getMessagesOptions(queryClient, client, params.channelId)))
      );
   },
   gcTime: 0,
   errorComponent: RouteErrorComponent,
});

function Component() {
   const client = useClient();
   const queryClient = useQueryClient();
   const { channelId } = Route.useParams();
   const { error, data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, channelId));
   const channel = useSuspenseQuery(getChannelsOptions(client, "@me")).data?.find((x: { id: string }) => x.id === channelId);

   const handleServerError = useErrorHandler();

   useEffect(() => {
      if (error) {
         handleServerError(error);
      }
   }, [error]);

   if (!channel) return;

   return (
      <div className="flex h-full flex-col">
         <HomeTopbar channel={channel} />
         <div className="h-0.5 flex-shrink-0 bg-white/10" />
         <ChannelMessages channelId={channelId} messages={messages.pages.flat()} />
         <div className="bg-background flex h-16 w-full flex-shrink-0">
            <MessageBox />
            <div className="h-full w-64 flex-shrink-0" />
         </div>
      </div>
   );
}
