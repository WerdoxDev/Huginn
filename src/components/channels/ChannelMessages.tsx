import { APIGetChannelMessagesResult } from "@shared/api-types";
import { GatewayDispatchEvents, GatewayMessageCreateDispatchData } from "@shared/gateway-types";
import { Snowflake } from "@shared/snowflake";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { client } from "../../lib/api";
import BaseMessage from "../BaseMessage";
import MessageBox from "../MessageBox";

export default function ChannelMessages(props: { channelId: Snowflake; messages: APIGetChannelMessagesResult }) {
   const queryClient = useQueryClient();
   const scroll = useRef<HTMLDivElement>(null);

   useEffect(() => {
      scrollToBottom();

      client.gateway.on(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);

      return () => {
         client.gateway.removeListener(GatewayDispatchEvents.MESSAGE_CREATE, onMessageCreated);
         console.log(props.channelId);
      };
   }, [props.channelId]);

   function onMessageCreated(d: GatewayMessageCreateDispatchData) {
      console.log(`HI ${props.channelId}`);
      if (d.channelId !== props.channelId) {
         return;
      }

      queryClient.setQueryData(["messages", props.channelId], (data: APIGetChannelMessagesResult) => [...data, d]);
      scrollToBottom();
   }

   function scrollToBottom() {
      scroll.current!.scrollTop = scroll.current!.scrollHeight;
   }

   useEffect(() => {
      scrollToBottom();
   }, [props.messages]);

   return (
      <div className="flex h-full flex-col">
         <div className="h-full flex-shrink overflow-x-hidden overflow-y-scroll" ref={scroll}>
            <ol className="flex min-h-full flex-col items-stretch justify-end gap-y-2 p-3 pr-0.5">
               {props.messages.map((message) => (
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
