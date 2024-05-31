import { GatewayDispatchEvents, GatewayMessageCreateDispatchData } from "@shared/gateway-types";
import { Snowflake } from "@shared/snowflake";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import BaseMessage from "../../../components/BaseMessage";
import MessageBox from "../../../components/MessageBox";
import { useServerErrorHandler } from "../../../hooks/useServerErrorHandler";
import { client } from "../../../lib/api";
import { requireAuth } from "../../../lib/middlewares";
import { APIGetChannelMessagesResult } from "@shared/api-types";

function getMessagesOptions(channelId: Snowflake) {
   return queryOptions({
      queryKey: ["messages", channelId],
      queryFn: () => client.channels.getMessages(channelId, 50),
      staleTime: 30000,
   });
}

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/channels/$guildId/$channelId")({
   beforeLoad() {
      requireAuth();
   },
   component: ChannelMessages,
   loader: ({ params, context: { queryClient } }) => {
      return queryClient.ensureQueryData(getMessagesOptions(params.channelId));
   },
   errorComponent: ErrorComponent,
});

function ErrorComponent(props: { error: unknown }) {
   const handleServerError = useServerErrorHandler();

   useEffect(() => {
      handleServerError(props.error);
   }, []);
}

function ChannelMessages() {
   const { guildId, channelId } = Route.useParams();
   const queryClient = useQueryClient();
   const { data: messages } = useSuspenseQuery(getMessagesOptions(channelId));
   const scroll = useRef<HTMLDivElement>(null);

   useEffect(() => {
      scrollToBottom();

      client.gateway.on(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);

      return () => {
         client.gateway.removeListener(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);
         console.log(channelId);
      };
   }, [channelId]);

   function onMessageCreated(d: GatewayMessageCreateDispatchData) {
      console.log(`HI ${channelId}`);
      if (d.channelId !== channelId) {
         return;
      }

      queryClient.setQueryData(["messages", channelId], (data: APIGetChannelMessagesResult) => [...data, d]);
      scrollToBottom();
   }

   function scrollToBottom() {
      scroll.current!.scrollTop = scroll.current!.scrollHeight;
   }

   useEffect(() => {
      scrollToBottom();
   }, [messages]);

   return (
      <div className="flex h-full flex-col">
         {/* ref to scroll */}
         <div className="h-full flex-shrink overflow-x-hidden overflow-y-scroll" ref={scroll}>
            {/* If messages */}
            <ol className="flex min-h-full flex-col items-stretch justify-end gap-y-2 p-3 pr-0.5">
               {messages.map((message) => (
                  <BaseMessage key={message.id} content={message.content} author={message.author} />
               ))}
            </ol>
         </div>
         <div className="flex h-16 w-full flex-shrink-0 bg-background">
            <MessageBox />
            <div className="h-full w-64 flex-shrink-0" />
         </div>
      </div>
   );
}
