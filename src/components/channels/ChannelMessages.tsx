import BaseMessage from "@components/BaseMessage";
import { useClient } from "@contexts/apiContext";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { getMessagesOptions } from "@lib/queries";
import { APIGetChannelMessagesResult } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export default function ChannelMessages(props: { channelId: Snowflake; messages: APIGetChannelMessagesResult }) {
   const client = useClient();
   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(client, props.channelId));
   const scroll = useRef<HTMLOListElement>(null);

   const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();

   const previousScrollTop = useRef(0);
   const newItemsHeight = useRef(0);

   function scrollToBottom() {
      scroll.current!.scrollTop = scroll.current!.scrollHeight;
   }

   async function onScroll(e: React.UIEvent<HTMLOListElement>) {
      if (scroll.current!.scrollTop <= 200 && !isFetchingPreviousPage && hasPreviousPage) {
         // Remove the old refs
         if (data.pages.length === 3) {
            data.pages[data.pages.length - 1].forEach((x) => {
               console.log(removeContent(x.id));
            });
         }

         await fetchPreviousPage();
         previousScrollTop.current = scroll.current!.scrollTop;
      } else if (
         e.currentTarget.scrollHeight - e.currentTarget.clientHeight - e.currentTarget.scrollTop <= 200 &&
         !isFetchingNextPage &&
         hasNextPage
      ) {
         await fetchNextPage();
      }
   }

   useEffect(() => {
      scrollToBottom();
   }, []);

   useEffect(() => {
      // Set previous to -1 so fetching next page doesnt do anything but prev page does.
      if (previousScrollTop.current !== -1) {
         let height = 0;
         data.pages[0].forEach((x) => (height += getContent(x.id)?.current?.offsetHeight ?? 0));
         newItemsHeight.current = height;

         scroll.current!.scrollTop = previousScrollTop.current + newItemsHeight.current;
         previousScrollTop.current = -1;
      }
   }, [props.messages]);

   return (
      <div className="relative flex flex-col overflow-hidden">
         <div
            className={`pointer-events-none absolute inset-x-0 z-10 py-2 text-center text-text ${isFetchingPreviousPage ? "top-0" : isFetchingNextPage ? "bottom-0" : "hidden"}`}
         >
            Loading...
         </div>
         <ol className="flex flex-col overflow-y-scroll p-2 pr-0.5" ref={scroll} onScroll={onScroll}>
            {props.messages.map((message) => (
               <BaseMessage
                  ref={setContent(message.id)}
                  key={message.id}
                  content={message.content}
                  author={message.author}
                  flags={message.flags}
               />
            ))}
         </ol>
      </div>
   );
}
