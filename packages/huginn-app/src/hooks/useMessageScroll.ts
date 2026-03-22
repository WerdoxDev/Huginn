import type { Snowflake } from "@huginn/shared";

import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { useMessageDiff, type ChangeType } from "@hooks/useMessageDiff";
import { usePrevious } from "@hooks/usePrevious";
import { getFirstChildClosestToBottom, getFirstChildClosestToTop } from "@lib/utils";
import { useChannelStore, type SavedScrollState } from "@stores/channelStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, useLayoutEffect, useRef } from "react";

import type { AppMessage, ProcessedMessage } from "@/types";

const TOP_SCROLL_OFFSET = 100;
const BOTTOM_SCROLL_OFFSET = 100;

interface UseMessageScrollOptions {
   channelId: Snowflake;
   messages: AppMessage[];
   processedMessages: ProcessedMessage[];
   queryData: unknown;
   fetchNextPage: () => Promise<unknown>;
   fetchPreviousPage: () => Promise<unknown>;
   isFetchingNextPage: boolean;
   isFetchingPreviousPage: boolean;
   hasNextPage: boolean;
   hasPreviousPage: boolean;
}

export function useMessageScroll(options: UseMessageScrollOptions) {
   const { user } = useThisUser();
   const { savedScrolls, saveScroll, currentEditingMessageId, messageBoxHeight, currentVisibleMessages, removeMessageUploadProgress } =
      useChannelStore();
   const previousMessageBoxHeight = usePrevious(messageBoxHeight);
   const { setRef, getRef } = useDynamicRefs<HTMLLIElement>();

   const scrollRef = useRef<HTMLDivElement>(null);
   const listRef = useRef<HTMLOListElement>(null);
   const shouldScrollToLastSeen = useRef(false);
   const shouldAnchorToBottom = useRef(false);
   const lastChannelId = useRef<Snowflake>(undefined);
   const lastScrollState = useRef<SavedScrollState | null>(null);
   const lastSeenElement = useRef<{
      messageId: Snowflake;
      height: number;
      distanceToTop: number;
      distanceToBottom: number;
   }>(null);
   const lastDirection = useRef<"up" | "down" | "none">("none");
   const isResizing = useRef(false);

   function scrollDown() {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
   }

   function scrollIntoViewMinimal(element: HTMLElement) {
      if (!scrollRef.current) return;

      const rect = element.getBoundingClientRect();
      const containerRect = scrollRef.current.getBoundingClientRect();

      if (rect.top < containerRect.top) {
         scrollRef.current.scrollTo({
            top: scrollRef.current.scrollTop + rect.top - containerRect.top - 10,
            behavior: "instant",
         });
      } else if (rect.bottom > containerRect.bottom) {
         scrollRef.current.scrollTo({
            top: scrollRef.current.scrollTop + rect.bottom - containerRect.bottom + 10,
            behavior: "instant",
         });
      }
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

      foundMessageElement.scrollIntoView({
         behavior: "instant",
         block: lastDirection.current === "up" ? "start" : "end",
      });
      const heightDifference = foundMessageElement.clientHeight - lastSeenElement.current.height;
      scrollRef.current.scrollTop +=
         (lastDirection.current === "up" ? lastSeenElement.current.distanceToTop : -lastSeenElement.current.distanceToBottom) + heightDifference;

      shouldScrollToLastSeen.current = false;
   }

   async function onScroll() {
      if (!scrollRef.current || options.messages.length === 0) return;

      const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - clientHeight - scrollTop <= 20;

      if (isAtBottom) {
         lastScrollState.current = { type: "bottom" };
      } else {
         lastScrollState.current = { type: "position", scrollTop, messageBoxHeight };
      }

      // Avoid reevaluating bottom state when scrolling due to resize anchoring
      if (!isResizing.current) {
         shouldAnchorToBottom.current = isAtBottom;
      } else {
         isResizing.current = false;
      }

      if (scrollRef.current.scrollTop <= TOP_SCROLL_OFFSET && !options.isFetchingPreviousPage && options.hasPreviousPage) {
         lastDirection.current = "up";
         await options.fetchPreviousPage();
         saveLastSeenMessage();
      } else if (
         scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop <= BOTTOM_SCROLL_OFFSET &&
         !options.isFetchingNextPage &&
         options.hasNextPage
      ) {
         lastDirection.current = "down";
         await options.fetchNextPage();
         saveLastSeenMessage();
      }
   }

   function onMessageAdd(message: ProcessedMessage) {
      if (!scrollRef.current) return;
      const scrollOffset = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop;
      const messageHeight = getRef(message.id)?.current?.clientHeight ?? 0;

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
         // scrollIntoViewMinimal(messageRef);
         return;
      }

      const scrollOffset = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop;
      const messageHeight = messageRef?.clientHeight ?? 0;

      if (scrollOffset - messageHeight <= 50) {
         scrollDown();
      }
   }

   useMessageDiff(options.processedMessages, { onMessageAdd, onMessageUpdate });

   // Adjust scroll when message box height changes
   // useEffect(() => {
   //    if (!scrollRef.current) return;

   //    if (scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop >= 1) {
   //       scrollRef.current.scrollTop += messageBoxHeight - (previousMessageBoxHeight ?? 0);
   //    }

   //    if (currentEditingMessageId && currentVisibleMessages.some((x) => x.messageId === currentEditingMessageId)) {
   //       const messageRef = getRef(currentEditingMessageId);
   //       if (messageRef.current) {
   //          scrollIntoViewMinimal(messageRef.current);
   //       }
   //    }
   // }, [messageBoxHeight]);

   // Restore scroll position after fetching
   useLayoutEffect(() => {
      if (!lastSeenElement.current || !scrollRef.current || lastChannelId.current !== options.channelId) return;
      scrollToLastSeenMessage();
   }, [options.queryData]);

   // Save scroll state when leaving a channel
   useEffect(() => {
      lastScrollState.current = null;
      lastDirection.current = "none";

      return () => {
         if (lastScrollState.current) {
            saveScroll(options.channelId, lastScrollState.current);
         }
      };
   }, [options.channelId]);

   // Restore scroll position when entering a channel
   useLayoutEffect(() => {
      if (options.messages.length === 0 || lastChannelId.current === options.channelId || !scrollRef.current) return;

      const saved = savedScrolls.get(options.channelId);
      if (saved?.type === "position") {
         const adjustment = saved.messageBoxHeight - messageBoxHeight;
         scrollRef.current.scrollTop = saved.scrollTop - adjustment;
         shouldAnchorToBottom.current = false;
      } else {
         scrollDown();
         shouldAnchorToBottom.current = true;
      }

      lastChannelId.current = options.channelId;
   }, [options.channelId, options.messages]);

   // Anchor to bottom on resize
   useEffect(() => {
      if (!scrollRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
         if (!scrollRef.current) return;
         const scrollHeight = entries[0].target.scrollHeight;

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

   return { scrollRef, listRef, setRef, onScroll };
}
