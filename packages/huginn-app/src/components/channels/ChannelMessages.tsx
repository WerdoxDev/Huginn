import { MessageProvider } from "@contexts/MessageProvider";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useMessageAcker } from "@hooks/mutations/useMessageAcker";
import { useFirstUnreadMessage } from "@hooks/useFirstUnreadMessage";
import { useMessageScroll } from "@hooks/useMessageScroll";
import { useVisibleMessages } from "@hooks/useVisibleMessages";
import { MessageType, type Snowflake } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { convertToAppMessage } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useQueryClient, useSuspenseInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AppMessage, ProcessedMessage } from "@/types";

import ChannelTypingIndicator from "./ChannelTypingIndicator";
import GhostMessages from "./GhostMessages";

const ACTION_MESSAGE_TYPES: MessageType[] = [
   MessageType.RECIPIENT_ADD,
   MessageType.RECIPIENT_REMOVE,
   MessageType.CHANNEL_ICON_CHANGED,
   MessageType.CHANNEL_NAME_CHANGED,
   MessageType.CHANNEL_OWNER_CHANGED,
   MessageType.CHANNEL_PINNED_MESSAGE,
   MessageType.CALL,
];

function processMessages(
   messages: AppMessage[],
   hasPreviousPage: boolean,
   firstUnreadMessageId?: Snowflake,
   currentEditingMessageId?: Snowflake,
   currentReplyingMessageId?: Snowflake,
   highlightedMessageId?: Snowflake,
): ProcessedMessage[] {
   return messages.map((message, i) => {
      const lastMessage: AppMessage | undefined = messages[i - 1];

      const hasNewDate = (lastMessage && !moment(message.timestamp).isSame(lastMessage.timestamp, "date")) || (!lastMessage && !hasPreviousPage);
      const hasNewMinute = !lastMessage || moment(message.timestamp).diff(moment(lastMessage.timestamp), "minutes") >= 5;
      const hasNewAuthor = message.authorId !== lastMessage?.authorId;
      const isActionType = message.isPreview ? false : ACTION_MESSAGE_TYPES.includes(message.type);
      const isReplyType = message.isPreview ? !!message.referencedMessage : message.type === MessageType.REPLY;

      return {
         ...message,
         hasNewMinute,
         hasNewDate,
         hasNewAuthor,
         isActionType,
         isReplyType,
         isUnread: firstUnreadMessageId === message.id,
         isEditing: currentEditingMessageId === message.id,
         isReplying: currentReplyingMessageId === message.id,
         isJumpHighlighted: highlightedMessageId === message.id,
      };
   });
}

export default function ChannelMessages(props: { channelId: Snowflake; messages: AppMessage[] }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const currentChannel = useCurrentChannel();

   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client!, props.channelId));

   const { currentEditingMessageId, currentReplyingMessageId } = useChannelStore();
   const { onMessageVisibilityChanged } = useVisibleMessages(props.channelId, props.messages);
   const [highlightedMessageId, setHighlightedMessageId] = useState<Snowflake | undefined>(undefined);

   useMessageAcker(props.channelId, props.messages);
   const { firstUnreadMessageId } = useFirstUnreadMessage(props.channelId, props.messages);

   const processedMessages = useMemo<ProcessedMessage[]>(
      () =>
         processMessages(
            props.messages,
            hasPreviousPage,
            firstUnreadMessageId,
            currentEditingMessageId,
            currentReplyingMessageId,
            highlightedMessageId,
         ),
      [props.messages, props.channelId, firstUnreadMessageId, currentEditingMessageId, currentReplyingMessageId, highlightedMessageId],
   );

   const ghostTopRef = useRef<HTMLDivElement>(null);
   const ghostBottomRef = useRef<HTMLDivElement>(null);
   const pendingReferencedMessageId = useRef<Snowflake | undefined>(undefined);
   const highlightTimeoutId = useRef<number | undefined>(undefined);
   const pendingScrollToBottom = useRef(false);

   const { scrollRef, listRef, setRef, onScroll, scrollToMessage, scrollToBottom } = useMessageScroll({
      channelId: props.channelId,
      messages: props.messages,
      processedMessages,
      queryData: data,
      fetchNextPage,
      fetchPreviousPage,
      isFetchingNextPage,
      isFetchingPreviousPage,
      hasNextPage,
      hasPreviousPage,
      ghostTopRef,
      ghostBottomRef,
   });

   const highlightMessage = useCallback((messageId: Snowflake) => {
      if (highlightTimeoutId.current !== undefined) {
         window.clearTimeout(highlightTimeoutId.current);
      }

      setHighlightedMessageId(messageId);
      highlightTimeoutId.current = window.setTimeout(() => {
         setHighlightedMessageId((current) => (current === messageId ? undefined : current));
      }, 2000);
   }, []);

   const hasLatestMessageInList = useMemo(() => {
      if (!currentChannel?.lastMessageId) {
         return true;
      }

      return props.messages.some((message) => message.id === currentChannel.lastMessageId);
   }, [currentChannel?.lastMessageId, props.messages]);

   const onReferencedMessageClick = useCallback(
      async (messageId: Snowflake) => {
         if (scrollToMessage(messageId)) {
            highlightMessage(messageId);
            return;
         }

         pendingReferencedMessageId.current = messageId;

         if (!client) {
            pendingReferencedMessageId.current = undefined;
            return;
         }

         const fetchedMessages = await client.channels.getMessages(props.channelId, 50, undefined, undefined, messageId);
         const aroundMessages = fetchedMessages.map((message) => convertToAppMessage(message, "fetch"));

         queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", props.channelId], {
            pages: [aroundMessages],
            pageParams: [{ before: "", after: "" }],
         });
      },
      [client, highlightMessage, props.channelId, queryClient, scrollToMessage],
   );

   useEffect(() => {
      const messageId = pendingReferencedMessageId.current;
      if (!messageId) return;

      if (scrollToMessage(messageId)) {
         highlightMessage(messageId);
      }
      pendingReferencedMessageId.current = undefined;
   }, [highlightMessage, props.messages, scrollToMessage]);

   const onScrollToBottomClick = useCallback(async () => {
      if (!client) {
         return;
      }

      const latestMessages = await client.channels.getMessages(props.channelId, 50);
      const convertedLatestMessages = latestMessages.map((message) => convertToAppMessage(message, "fetch"));

      pendingScrollToBottom.current = true;
      queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", props.channelId], {
         pages: [convertedLatestMessages],
         pageParams: [{ before: "", after: "" }],
      });
   }, [client, props.channelId, queryClient]);

   useEffect(() => {
      if (!pendingScrollToBottom.current) return;
      if (!scrollToBottom()) return;

      pendingScrollToBottom.current = false;
   }, [props.messages, scrollToBottom]);

   useEffect(() => {
      return () => {
         if (highlightTimeoutId.current !== undefined) {
            window.clearTimeout(highlightTimeoutId.current);
         }
      };
   }, []);

   return (
      <div className="relative h-full overflow-y-hidden">
         <ChannelTypingIndicator channelId={props.channelId} />
         <div className="h-full w-full overflow-x-hidden overflow-y-scroll [overflow-anchor:none]" ref={scrollRef} onScroll={onScroll}>
            <div className="flex min-h-full flex-col justify-end">
               {hasPreviousPage && (
                  <div ref={ghostTopRef}>
                     <GhostMessages position="top" />
                  </div>
               )}
               <ol className="min-h-0 overflow-hidden pr-0 pb-7" ref={listRef}>
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
                        onReferencedMessageClick={onReferencedMessageClick}
                     />
                  ))}
               </ol>
               {hasNextPage && (
                  <div ref={ghostBottomRef}>
                     <GhostMessages position="bottom" />
                  </div>
               )}
            </div>
         </div>
         {!hasLatestMessageInList && (
            <button
               type="button"
               className="bg-surface-alt ring-primary-700 hover:bg-primary-800 hover:text-text text-text/80 absolute right-4 bottom-4 z-20 cursor-pointer rounded-full p-2 ring-1 transition-all"
               onClick={onScrollToBottomClick}
            >
               <IconMingcuteDownFill className="size-5" />
            </button>
         )}
      </div>
   );
}
