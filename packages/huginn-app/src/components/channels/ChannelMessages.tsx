import BaseMessage from "@components/BaseMessage";
import { useClient } from "@contexts/apiContext";
import { useChannelScroll, useChannelScrollDispatch } from "@contexts/channelScrollContext";
import { useEvent } from "@contexts/event";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { APIGetChannelMessagesResult, Snowflake } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const topScrollOffset = 200;
const bottomScrollOffset = 200;

export default function ChannelMessages(props: { channelId: Snowflake; messages: APIGetChannelMessagesResult }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const { listenEvent } = useEvent();

   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

   const scroll = useRef<HTMLOListElement>(null);

   const channelScroll = useChannelScroll();
   const channelScrollDispatch = useChannelScrollDispatch();

   const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();

   const previousScrollTop = useRef(0);
   const newItemsHeight = useRef(0);
   const listHasUpdated = useRef(false);

   async function onScroll() {
      if (!scroll.current) return;
      channelScrollDispatch({ channelId: props.channelId, scroll: scroll.current.scrollTop ?? 0 });

      if (scroll.current.scrollTop <= topScrollOffset && !isFetchingPreviousPage && hasPreviousPage && listHasUpdated.current) {
         // Remove the old refs
         if (data.pages.length === 3) {
            data.pages[data.pages.length - 1].forEach(x => {
               removeContent(x.id);
            });
         }

         listHasUpdated.current = false;
         await fetchPreviousPage();
         previousScrollTop.current = scroll.current.scrollTop;
         setTimeout(() => {
            console.log(data.pages);
         }, 1000);
      } else if (
         scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop <= bottomScrollOffset &&
         !isFetchingNextPage &&
         hasNextPage &&
         listHasUpdated.current
      ) {
         listHasUpdated.current = false;
         await fetchNextPage();
      }
   }

   useEffect(() => {
      if (channelScroll.has(props.channelId) && scroll.current) {
         const newScroll = channelScroll.get(props.channelId) ?? 0;
         scroll.current.scrollTop = newScroll;
      }

      const unlisten = listenEvent("message_added", d => {
         if (!scroll.current || !d.visible) return;
         const scrollOffset = scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop;

         // if (d.self || scrollOffset <= 50) {
         //    scroll.current.scrollTop = scroll.current.scrollHeight - scroll.current.clientHeight;
         // }
      });

      return () => {
         unlisten();
      };
   }, [props.channelId]);

   useEffect(() => {
      // Set previous to -1 so fetching next page doesnt do anything but prev page does.
      if (!scroll.current) return;

      if (previousScrollTop.current !== -1) {
         let height = 0;
         data.pages[0].forEach(x => (height += getContent(x.id)?.current?.offsetHeight ?? 0));
         newItemsHeight.current = height;

         scroll.current.scrollTop = previousScrollTop.current + newItemsHeight.current;
         previousScrollTop.current = -1;
      }

      const unlisten = listenEvent("message_added", d => {
         if (!scroll.current || !d.visible) return;
         console.log("HII? I GUESS...");

         // if (d.self) {
         // }
      });

      console.log("top");
      scroll.current.scrollTop = scroll.current.scrollHeight - scroll.current.clientHeight;

      listHasUpdated.current = true;

      return () => {
         console.log("gooooone");
         unlisten();
      };
   }, [props.messages]);

   return (
      <div className="relative flex flex-col overflow-hidden">
         <div
            className={`pointer-events-none absolute inset-x-0 z-10 py-2 text-center text-text ${isFetchingPreviousPage ? "top-0" : isFetchingNextPage ? "bottom-0" : "hidden"}`}
         >
            Loading...
         </div>
         <ol className="flex flex-col overflow-y-scroll p-2 pr-0.5" ref={scroll} onScroll={onScroll}>
            {props.messages.map(message => (
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
