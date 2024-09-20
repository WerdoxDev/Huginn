import { MessageRenderInfo } from "@/types";
import BaseMessage from "@components/BaseMessage";
import ChannelMessageLoadingIndicator from "@components/ChannelMessageLoadingIndicator";
import { useClient } from "@contexts/apiContext";
import { useChannelScroll, useChannelScrollDispatch } from "@contexts/channelScrollContext";
import { useEvent } from "@contexts/eventContext";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { APIDefaultMessage, APIGetChannelMessagesResult, Snowflake } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import { RefObject, useEffect, useMemo, useRef } from "react";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: APIGetChannelMessagesResult }) {
   const client = useClient();
   const queryClient = useQueryClient();

   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

   const channelScroll = useChannelScroll();
   const channelScrollDispatch = useChannelScrollDispatch();
   const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();
   const { listenEvent } = useEvent();

   const messageRenderInfos = useMemo<MessageRenderInfo[]>(() => calculateMessageRenderInfos(), [props.messages, props.channelId]);
   const scroll = useRef<HTMLOListElement>(null);
   const previousScrollTop = useRef(-1);
   const itemsHeight = useRef(0);
   const listHasUpdated = useRef(false);
   const shouldScrollOnNextRender = useRef(false);

   async function onScroll() {
      if (!scroll.current) return;
      channelScrollDispatch({ channelId: props.channelId, scroll: scroll.current.scrollTop ?? 0 });

      // Scrolling up
      if (scroll.current.scrollTop <= topScrollOffset && !isFetchingPreviousPage && hasPreviousPage && listHasUpdated.current) {
         // Remove the old refs
         if (data.pages.length === 3) {
            data.pages[data.pages.length - 1].forEach(x => {
               removeContent(x.id);
               removeContent(x.id + "_separator");
            });
         }

         await fetchPrevious();
         // Scrolling down
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

   async function fetchPrevious() {
      if (!scroll.current) {
         return;
      }

      listHasUpdated.current = false;
      await fetchPreviousPage();
      previousScrollTop.current = scroll.current.scrollTop;
   }

   function calculateMessageRenderInfos(): MessageRenderInfo[] {
      const value = props.messages.map((message, i) => {
         const lastMessage = props.messages[i - 1];

         const differentDate = !moment(message.createdAt).isSame(lastMessage?.createdAt, "date") && !!lastMessage;

         const differentMinute = !moment(message.createdAt).isSame(lastMessage?.createdAt, "minute");

         return { message, newMinute: differentMinute, newDate: differentDate };
      });

      return value;
   }

   function scrollDown() {
      if (!scroll.current) {
         return;
      }

      scroll.current.scrollTop = scroll.current.scrollHeight - scroll.current.clientHeight;
   }

   function getFullHeight(element?: HTMLLIElement | null) {
      if (!element) {
         return 0;
      }

      const styles = getComputedStyle(element);
      const margin = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);

      return element.offsetHeight + margin;
   }

   async function checkForExtraSpace() {
      if (!scroll.current) {
         return;
      }

      if (scroll.current.scrollHeight === scroll.current.clientHeight && !isFetchingPreviousPage) {
         await fetchPrevious();
      }
   }

   useEffect(() => {
      checkForExtraSpace();

      if (channelScroll.has(props.channelId) && scroll.current) {
         const newScroll = channelScroll.get(props.channelId) ?? 0;
         scroll.current.scrollTop = newScroll;
      } else {
         scrollDown();
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
      if (!scroll.current) return;

      let height = 0;
      data.pages[0].forEach(x => {
         const elementHeight = getFullHeight(getContent(x.id)?.current) + getFullHeight(getContent(x.id + "_separator")?.current);
         height += elementHeight;
      });

      // Set previous to -1 so fetching next page doesnt do anything but prev page does.
      if (previousScrollTop.current !== -1) {
         let previousHeight = 0;
         let previousHeightDiff = 0;

         data.pages[1].forEach(x => {
            const elementHeight = getFullHeight(getContent(x.id)?.current) + getFullHeight(getContent(x.id + "_separator")?.current);
            previousHeight += elementHeight;
         });

         previousHeightDiff = itemsHeight.current - previousHeight;
         scroll.current.scrollTop = previousScrollTop.current + (height - previousHeightDiff);
         previousScrollTop.current = -1;
      }

      if (shouldScrollOnNextRender.current) {
         scrollDown();
         shouldScrollOnNextRender.current = false;
      }

      itemsHeight.current = height;

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
            {props.messages.map((message, i) => (
               <MessageRenderer
                  key={message.id}
                  message={message}
                  renderInfo={messageRenderInfos[i]}
                  nextRenderInfo={messageRenderInfos[i + 1]}
                  lastRenderInfo={messageRenderInfos[i - 1]}
                  setContent={setContent}
               />
            ))}
         </ol>
      </div>
   );
}

function MessageRenderer(props: {
   message: APIDefaultMessage;
   renderInfo: MessageRenderInfo;
   nextRenderInfo?: MessageRenderInfo;
   lastRenderInfo?: MessageRenderInfo;
   setContent: (ket: string) => RefObject<HTMLLIElement>;
}) {
   return (
      <>
         {props.renderInfo.newDate && (
            <li
               className="text-text/70 mx-2 my-5 flex h-0 items-center justify-center text-center text-xs font-semibold [border-top:thin_solid_rgb(var(--color-text)/0.25)]"
               ref={props.setContent(props.message.id + "_separator")}
            >
               <span className="bg-tertiary px-2">{moment(props.message.createdAt).format("DD. MMMM YYYY")}</span>
            </li>
         )}
         <BaseMessage
            newDate={props.renderInfo.newDate}
            newMinute={props.renderInfo.newMinute}
            lastNewMinute={props.lastRenderInfo?.newMinute}
            nextNewMinute={props.nextRenderInfo?.newMinute}
            ref={props.setContent(props.message.id)}
            content={props.message.content}
            createdAt={props.message.createdAt as unknown as string}
            author={props.message.author}
            flags={props.message.flags}
         />
      </>
   );
}
