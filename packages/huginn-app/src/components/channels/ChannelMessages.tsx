import BaseMessage from "@components/BaseMessage";
import ChannelMessageLoadingIndicator from "@components/ChannelMessageLoadingIndicator";
import { useClient } from "@contexts/apiContext";
import { useChannelScroll, useChannelScrollDispatch } from "@contexts/channelScrollContext";
import { useEvent } from "@contexts/eventContext";
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

   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

   const channelScroll = useChannelScroll();
   const channelScrollDispatch = useChannelScrollDispatch();
   const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();
   const { listenEvent } = useEvent();

   const scroll = useRef<HTMLOListElement>(null);
   const previousScrollTop = useRef(0);
   const newItemsHeight = useRef(0);
   const listHasUpdated = useRef(false);
   const shouldScrollOnNextRender = useRef(false);

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

         if (d.self || scrollOffset <= 50) {
            shouldScrollOnNextRender.current = true;
         }
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

      if (shouldScrollOnNextRender.current) {
         scroll.current.scrollTop = scroll.current.scrollHeight - scroll.current.clientHeight;
         shouldScrollOnNextRender.current = false;
      }

      listHasUpdated.current = true;
   }, [props.messages]);

   return (
      <div className="relative flex h-full flex-col overflow-hidden">
         <ChannelMessageLoadingIndicator isFetchingNextPage={isFetchingNextPage} isFetchingPreviousPage={isFetchingPreviousPage} />
         <ol className="flex h-full flex-col overflow-y-scroll p-2 pr-0.5" ref={scroll} onScroll={onScroll}>
            {props.messages.length === 0 && (
               <div className="flex h-full w-full items-center justify-center">
                  <div className="bg-background text-text rounded-lg p-2 italic">Empty...</div>
               </div>
            )}
            {props.messages.map(message => (
               <BaseMessage
                  ref={setContent(message.id)}
                  key={message.id}
                  content={message.content}
                  createdAt={message.createdAt}
                  author={message.author}
                  flags={message.flags}
               />
            ))}
         </ol>
      </div>
   );
}
