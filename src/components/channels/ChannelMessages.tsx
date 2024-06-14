import BaseMessage from "@components/BaseMessage";
import MessageBox from "@components/MessageBox";
import { APIGetChannelMessagesResult } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { useEffect, useRef } from "react";

export default function ChannelMessages(props: { channelId: Snowflake; messages: APIGetChannelMessagesResult }) {
   const scroll = useRef<HTMLDivElement>(null);

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
