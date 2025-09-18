import { MessageProvider } from "@contexts/MessageProvider";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useMessageAcker } from "@hooks/mutations/useMessageAcker";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { useFirstUnreadMessage } from "@hooks/useFirstUnreadMessage";
import { useVisibleMessages } from "@hooks/useVisibleMessages";
import { MessageType, type Snowflake } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { getFirstChildClosestToBottom, getFirstChildClosestToTop } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { AppMessage, ProcessedMessage } from "@/types";
import ChannelMessageLoadingIndicator from "./ChannelMessageLoadingIndicator";
import ChannelTypingIndicator from "./ChannelTypingIndicator";
import { useMessageDiff, type ChangeType } from "@hooks/useMessageDiff";
import { useThisUser } from "@stores/userStore";
import { usePrevious } from "@hooks/usePrevious";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: AppMessage[] }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const { user } = useThisUser();

   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client!, props.channelId));

   const {
      savedScrolls,
      saveScroll,
      currentEditingMessageId,
      currentReplyingMessageId,
      messageBoxHeight,
      currentVisibleMessages,
      removeMessageUploadProgress,
   } = useChannelStore();
   const previousMessageBoxHeight = usePrevious(messageBoxHeight);

   const { onMessageVisibilityChanged } = useVisibleMessages(props.channelId, props.messages);
   const { setRef, getRef } = useDynamicRefs<HTMLLIElement>();

   useMessageAcker(props.channelId, props.messages);
   const { firstUnreadMessageId } = useFirstUnreadMessage(props.channelId, props.messages);

   const processedMessages = useMemo<ProcessedMessage[]>(
      () => processMessages(props.messages),
      [props.messages, props.channelId, firstUnreadMessageId, currentEditingMessageId, currentReplyingMessageId],
   );

   useMessageDiff(processedMessages, { onMessageAdd, onMessageUpdate });

   const scrollRef = useRef<HTMLDivElement>(null);
   const listRef = useRef<HTMLOListElement>(null);
   const shouldScrollToLastSeen = useRef(false);
   const shouldAnchorToBottom = useRef(false);
   const lastChannelId = useRef<Snowflake>(undefined);
   const lastScrollTop = useRef<number>(undefined);
   const lastDistanceToBottom = useRef<number>(undefined);
   const lastSeenElement = useRef<{ messageId: Snowflake; height: number; distanceToTop: number; distanceToBottom: number }>(null);
   const lastDirection = useRef<"up" | "down" | "none">("none");
   const isResizing = useRef(false);
   const currentChannel = useCurrentChannel();

   async function onScroll() {
      if (!scrollRef.current || props.messages.length === 0) return;
      lastScrollTop.current = scrollRef.current.scrollTop;

      // This is to not reevaluate wether or not we are at the bottom when we scroll because of anchoring on resize
      if (!isResizing.current) {
         shouldAnchorToBottom.current = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop <= 20;
      } else {
         isResizing.current = false;
      }

      // Scrolling up
      if (scrollRef.current.scrollTop <= topScrollOffset && !isFetchingPreviousPage && hasPreviousPage) {
         lastDirection.current = "up";
         await fetchPreviousPage();

         saveLastSeenMessage();
      }
      // Scrolling down
      else if (
         scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop <= bottomScrollOffset &&
         !isFetchingNextPage &&
         hasNextPage
      ) {
         lastDirection.current = "down";
         await fetchNextPage();

         saveLastSeenMessage();
      }
   }

   function processMessages(messages: AppMessage[]): ProcessedMessage[] {
      const value = messages.map((message, i) => {
         const lastMessage: AppMessage | undefined = props.messages[i - 1];

         const hasNewDate =
            (lastMessage && !moment(message.timestamp).isSame(lastMessage?.timestamp, "date")) || (!lastMessage && !hasPreviousPage);
         const hasNewMinute = !lastMessage || moment(message.timestamp).diff(moment(lastMessage.timestamp), "minutes") >= 5;
         const hasNewAuthor = message.authorId !== lastMessage?.authorId;
         const isActionType = message.isPreview
            ? false
            : [
                 MessageType.RECIPIENT_ADD,
                 MessageType.RECIPIENT_REMOVE,
                 MessageType.CHANNEL_ICON_CHANGED,
                 MessageType.CHANNEL_NAME_CHANGED,
                 MessageType.CHANNEL_OWNER_CHANGED,
                 MessageType.CHANNEL_PINNED_MESSAGE,
                 MessageType.CALL,
              ].includes(message.type);
         const isReplyType =
            (message.isPreview && message.referencedMessage) || (!message.isPreview && message.type === MessageType.REPLY) ? true : false;
         const isUnread = firstUnreadMessageId === message.id;
         const isEditing = currentEditingMessageId === message.id;
         const isReplying = currentReplyingMessageId === message.id;

         return { ...message, hasNewMinute, hasNewDate, hasNewAuthor, isActionType, isUnread, isEditing, isReplyType, isReplying };
      });

      return value;
   }

   function scrollDown() {
      if (!scrollRef.current) {
         return;
      }

      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
   }

   function saveLastSeenMessage() {
      if (!scrollRef.current || !listRef.current) return;

      const messageElement = (
         lastDirection.current === "up" ? getFirstChildClosestToTop(listRef.current) : getFirstChildClosestToBottom(listRef.current)
      ) as HTMLLIElement;
      if (!messageElement) return;

      lastSeenElement.current = {
         messageId: messageElement.id,
         height: messageElement.clientHeight,
         distanceToTop: scrollRef.current.scrollTop,
         distanceToBottom: scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight - 28,
      };

      shouldScrollToLastSeen.current = true;
   }

   function scrollToLastSeenMessage() {
      if (!lastSeenElement.current || !scrollRef.current || !listRef.current || !shouldScrollToLastSeen.current) return;

      const foundMessageElement = [...listRef.current.children].find((x) => x.id === lastSeenElement.current?.messageId) as HTMLLIElement;

      foundMessageElement.scrollIntoView({ behavior: "instant", block: lastDirection.current === "up" ? "start" : "end" });
      const heightDifference = foundMessageElement.clientHeight - lastSeenElement.current.height;
      scrollRef.current.scrollTop +=
         (lastDirection.current === "up" ? lastSeenElement.current.distanceToTop : -lastSeenElement.current.distanceToBottom) +
         heightDifference;

      shouldScrollToLastSeen.current = false;
   }

   function scrollIntoViewMinimal(element: HTMLElement) {
      if (!scrollRef.current) {
         return;
      }

      const rect = element.getBoundingClientRect();
      const containerRect = scrollRef.current.getBoundingClientRect();

      // Element is above visible area
      if (rect.top < containerRect.top) {
         const scrollTop = scrollRef.current.scrollTop;
         const offset = rect.top - containerRect.top;
         scrollRef.current.scrollTo({
            top: scrollTop + offset - 10,
            behavior: "instant",
         });
      }
      // Element is below visible area
      else if (rect.bottom > containerRect.bottom) {
         const scrollTop = scrollRef.current.scrollTop;
         const offset = rect.bottom - containerRect.bottom;
         scrollRef.current.scrollTo({
            top: scrollTop + offset + 10,
            behavior: "instant",
         });
      }
   }

   function onMessageAdd(message: ProcessedMessage) {
      if (!scrollRef.current) return;
      const scrollOffset = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop;
      const messageHeight = getRef(message.id)?.current.clientHeight ?? 0;

      if (message.authorId === user?.id || scrollOffset - messageHeight <= 50) {
         scrollDown();
      }
   }

   function onMessageUpdate(previousMessage: ProcessedMessage, message: ProcessedMessage, changeType: ChangeType, _isVisible: boolean) {
      if (!scrollRef.current) return;
      const messageRef = getRef(message.id)?.current;

      if (changeType === "preview") {
         removeMessageUploadProgress(previousMessage.id);
      }

      if (changeType === "edit" && messageRef) {
         scrollIntoViewMinimal(messageRef);
         return;
      }

      const scrollOffset = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop;
      const messageHeight = messageRef?.clientHeight ?? 0;

      if (scrollOffset - messageHeight <= 50) {
         scrollDown();
      }
   }

   useEffect(() => {
      if (!scrollRef.current) return;

      if (scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop >= 1) {
         scrollRef.current.scrollTop += messageBoxHeight - (previousMessageBoxHeight ?? 0);
      }

      // Try to keep the editing message in viewport if it's even slightly visible
      if (currentEditingMessageId && currentVisibleMessages.some((x) => x.messageId === currentEditingMessageId)) {
         const messageRef = getRef(currentEditingMessageId);
         if (messageRef) {
            scrollIntoViewMinimal(messageRef.current);
         }
      }
   }, [messageBoxHeight]);

   // Calculating scroll top position after an upward fetch
   useLayoutEffect(() => {
      if (!lastSeenElement.current || !scrollRef.current || lastChannelId.current !== props.channelId) {
         return;
      }

      scrollToLastSeenMessage();
   }, [data]);

   useEffect(() => {
      lastDistanceToBottom.current = undefined;
      saveScroll(lastChannelId.current ?? props.channelId, lastScrollTop.current ?? 0);
      lastDirection.current = "none";

      return () => {
         saveScroll(lastChannelId.current ?? props.channelId, lastScrollTop.current ?? 0);
      };
   }, [props.channelId]);

   // Scrolling to saved scroll
   useEffect(() => {
      if (props.messages.length === 0) return;

      if (lastChannelId.current !== props.channelId) {
         if (savedScrolls.has(props.channelId) && scrollRef.current) {
            const newScroll = savedScrolls.get(props.channelId) ?? 0;
            scrollRef.current.scrollTop = newScroll;
         } else {
            scrollDown();
         }
         lastChannelId.current = props.channelId;
      }
   }, [props.messages]);

   useEffect(() => {
      if (!scrollRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
         if (!scrollRef.current) return;
         const scrollHeight = entries[0].target.scrollHeight;

         // This is to not set "isResizing" when we are already at the bottom
         const alreadyAtBottom = scrollRef.current.scrollTop + scrollRef.current.clientHeight >= scrollRef.current.scrollHeight;

         if (shouldAnchorToBottom.current) {
            isResizing.current = !alreadyAtBottom;
            scrollRef.current.scrollTo(0, scrollHeight);
         }
      });

      resizeObserver.observe(scrollRef.current);

      return () => {
         resizeObserver.disconnect();
      };
   }, []);

   return (
      <div className="relative h-full overflow-y-hidden">
         <ChannelMessageLoadingIndicator isFetchingNextPage={isFetchingNextPage} isFetchingPreviousPage={isFetchingPreviousPage} />
         <ChannelTypingIndicator channelId={props.channelId} />
         <div className="h-full w-full overflow-x-hidden overflow-y-scroll [overflow-anchor:none]" ref={scrollRef} onScroll={onScroll}>
            <div className="flex min-h-full flex-col justify-end">
               <ol className="min-h-0 overflow-hidden pb-7 pr-0" ref={listRef}>
                  {props.messages.length === 0 && (
                     <div className="flex h-full w-full shrink-0 items-center justify-center">
                        <div className="bg-surface text-text flex items-center justify-center gap-x-2 rounded-lg p-2 pr-3 italic underline">
                           <IconMingcuteLookDownFill className="size-10" />
                           <span>Empty</span>
                        </div>
                     </div>
                  )}
                  {!hasPreviousPage && props.messages.length !== 0 && (
                     <div className="flex h-20 shrink-0 flex-col justify-center">
                        <div className="text-text/70 ml-10">
                           The beginning of your chat with <span className="text-text font-bold">{currentChannel?.name}</span>
                        </div>
                     </div>
                  )}
                  {processedMessages.map((x, i) => (
                     <MessageProvider
                        ref={setRef(x.id)}
                        key={x.nonce ?? x.id}
                        message={x}
                        nextMessage={processedMessages[i + 1]}
                        lastMessage={processedMessages[i - 1]}
                        onVisibilityChanged={onMessageVisibilityChanged}
                     />
                  ))}
               </ol>
            </div>
         </div>
      </div>
   );
}
