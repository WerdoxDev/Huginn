import LoadingIcon from "@components/LoadingIcon";
import { MessageProvider } from "@contexts/MessageProvider";
import { useMessageAcker } from "@hooks/mutations/useMessageAcker";
import { useFirstUnreadMessage } from "@hooks/useFirstUnreadMessage";
import { useIsMobile } from "@hooks/useIsMobile";
import { useMessageScroll } from "@hooks/useMessageScroll";
import { useVisibleMessages } from "@hooks/useVisibleMessages";
import { ChannelType, MessageType, type Snowflake } from "@huginnjs/shared";
import { getMessagesOptions } from "@lib/queries";
import { convertToAppMessage } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient, useSuspenseInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AppDirectChannel, AppMessage, ProcessedMessage } from "@/types";

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

function shallowEqual(a: object, b: object) {
   const aKeys = Object.keys(a);
   if (aKeys.length !== Object.keys(b).length) return false;
   return aKeys.every((k) => a[k as keyof typeof a] === b[k as keyof typeof b]);
}

export default function ChannelMessages(props: { messages: AppMessage[]; channel: AppDirectChannel }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const isMobile = useIsMobile();
   const { user } = useThisUser();

   const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
      useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client!, props.channel.id));

   const { currentEditingMessageId, currentReplyingMessageId, jumpToMessageRequest, clearJumpToMessageRequest } = useChannelStore();
   const { onMessageVisibilityChanged } = useVisibleMessages(props.channel.id, props.messages);
   const [highlightedMessageId, setHighlightedMessageId] = useState<Snowflake | undefined>(undefined);

   const [isLoadingLatest, setIsLoadingLatest] = useState(false);

   useMessageAcker(props.channel.id, props.messages);
   const { firstUnreadMessageId } = useFirstUnreadMessage(props.channel.id, props.messages);

   const prevProcessed = useRef<Map<Snowflake, ProcessedMessage>>(new Map());
   const prevChannelId = useRef<Snowflake | undefined>(props.channel.id);

   const processedMessages = useMemo<ProcessedMessage[]>(() => {
      if (prevChannelId.current !== props.channel.id) {
         prevProcessed.current = new Map();
         prevChannelId.current = props.channel.id;
      }

      const prevMap = prevProcessed.current;
      const nextMap = new Map<Snowflake, ProcessedMessage>();

      const result = props.messages.map((message, i) => {
         const lastMessage: AppMessage | undefined = props.messages[i - 1];

         const hasNewDate = (lastMessage && !moment(message.timestamp).isSame(lastMessage.timestamp, "date")) || (!lastMessage && !hasPreviousPage);
         const hasNewMinute = !lastMessage || moment(message.timestamp).diff(moment(lastMessage.timestamp), "minutes") >= 5;
         const hasNewAuthor = message.authorId !== lastMessage?.authorId;
         const isActionType = message.isPreview ? false : ACTION_MESSAGE_TYPES.includes(message.type);
         const isReplyType = message.isPreview ? !!message.referencedMessage : message.type === MessageType.REPLY;
         const isMentioned = message.isPreview
            ? false
            : (((message.mentions?.some((mention) => mention === user?.id) ?? false) ||
                 message.mentionEveryone ||
                 (message.mentionOwner && props.channel.type === ChannelType.GROUP_DM && props.channel.ownerId === user?.id)) ??
              false);

         const nextProcessed: ProcessedMessage = {
            ...message,
            hasNewMinute,
            hasNewDate,
            hasNewAuthor,
            isActionType,
            isReplyType,
            isMentioned,
            isUnread: firstUnreadMessageId === message.id,
            isEditing: currentEditingMessageId === message.id,
            isReplying: currentReplyingMessageId === message.id,
            isJumpHighlighted: highlightedMessageId === message.id,
         };

         // Reuse the old reference if nothing changed
         const prevProcessed = prevMap.get(message.id);
         const stable = prevProcessed && shallowEqual(prevProcessed, nextProcessed) ? prevProcessed : nextProcessed;

         nextMap.set(message.id, stable);
         return stable;
      });

      prevProcessed.current = nextMap;
      return result;
   }, [props.messages, props.channel.id, firstUnreadMessageId, currentEditingMessageId, currentReplyingMessageId, highlightedMessageId]);

   // const processedMessages = useMemo<ProcessedMessage[]>(
   //    () =>
   //       processMessages(
   //          props.messages,
   //          hasPreviousPage,
   //          firstUnreadMessageId,
   //          currentEditingMessageId,
   //          currentReplyingMessageId,
   //          highlightedMessageId,
   //       ),
   //    [props.messages, props.channel.id, firstUnreadMessageId, currentEditingMessageId, currentReplyingMessageId, highlightedMessageId],
   // );

   const ghostTopRef = useRef<HTMLDivElement>(null);
   const ghostBottomRef = useRef<HTMLDivElement>(null);
   const pendingReferencedMessageId = useRef<Snowflake | undefined>(undefined);
   const highlightTimeoutId = useRef<number | undefined>(undefined);
   const pendingScrollToBottom = useRef(false);

   const { scrollRef, listRef, setRef, onScroll, scrollToMessage, scrollToBottom } = useMessageScroll({
      channelId: props.channel.id,
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
      if (!props.channel?.lastMessageId) return true;

      const result = props.messages.some((message) => message.id === props.channel.lastMessageId);
      return result;
   }, [props.channel?.lastMessageId, props.messages]);

   const jumpToReferencedMessage = useCallback(
      async (messageId: Snowflake) => {
         if (!client) return;

         if (scrollToMessage(messageId)) {
            highlightMessage(messageId);
            return;
         }

         pendingReferencedMessageId.current = messageId;

         const fetchedMessages = await client.channels.getMessages(props.channel.id, 50, undefined, undefined, messageId);
         const aroundMessages = fetchedMessages.map((message) => convertToAppMessage(message, "fetch"));

         queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", props.channel.id], {
            pages: [aroundMessages],
            pageParams: [{ before: "", after: "" }],
         });
      },
      [client, highlightMessage, props.channel.id, queryClient, scrollToMessage],
   );

   const loadLatestMessages = useCallback(async () => {
      if (!client) return;

      const latestMessages = await client.channels.getMessages(props.channel.id, 50);
      const convertedLatestMessages = latestMessages.map((message) => convertToAppMessage(message, "fetch"));

      pendingScrollToBottom.current = true;
      queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", props.channel.id], {
         pages: [convertedLatestMessages],
         pageParams: [{ before: "", after: "" }],
      });
   }, [client, props.channel.id, queryClient]);

   const handleLoadLatest = useCallback(() => {
      setIsLoadingLatest(true);
      loadLatestMessages().finally(() => {
         setIsLoadingLatest(false);
      });
   }, [loadLatestMessages, setIsLoadingLatest]);

   useEffect(() => {
      if (!jumpToMessageRequest) return;
      if (jumpToMessageRequest.channelId !== props.channel.id) return;

      void jumpToReferencedMessage(jumpToMessageRequest.messageId);
      clearJumpToMessageRequest();
   }, [clearJumpToMessageRequest, jumpToReferencedMessage, jumpToMessageRequest, props.channel.id]);

   // Scroll to referenced message when it is loaded
   useEffect(() => {
      const messageId = pendingReferencedMessageId.current;
      if (!messageId) return;

      if (scrollToMessage(messageId)) {
         highlightMessage(messageId);
      }
      pendingReferencedMessageId.current = undefined;
   }, [highlightMessage, props.messages, scrollToMessage]);

   useEffect(() => {
      if (!pendingScrollToBottom.current) return;
      if (!scrollToBottom()) return;

      pendingScrollToBottom.current = false;
   }, [props.messages, scrollToBottom]);

   useEffect(() => {
      if (highlightTimeoutId.current !== undefined) {
         window.clearTimeout(highlightTimeoutId.current);
      }

      return () => {
         if (highlightTimeoutId.current !== undefined) {
            window.clearTimeout(highlightTimeoutId.current);
         }
      };
   }, [props.channel.id]);

   return (
      <div className="relative h-full overflow-y-hidden">
         <div className="h-full w-full overflow-x-hidden overflow-y-scroll scroll-auto [overflow-anchor:none]" ref={scrollRef} onScroll={onScroll}>
            <div className="flex min-h-full flex-col justify-end">
               {hasPreviousPage && <GhostMessages ref={ghostTopRef} />}
               <ol className="min-h-0 pr-0 pb-7" ref={listRef}>
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
                           The beginning of your chat with <span className="text-text font-bold">{props.channel?.name}</span>
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
                        channelId={props.channel.id}
                        options={{ hideActions: isMobile }}
                     />
                  ))}
               </ol>
               {hasNextPage && <GhostMessages ref={ghostBottomRef} />}
            </div>
         </div>
         {!hasLatestMessageInList && (
            <button
               type="button"
               className="bg-surface-alt ring-primary-700 hover:bg-primary-800 hover:text-text text-text/80 absolute right-4 bottom-4 z-20 cursor-pointer rounded-full p-2 ring-1 transition-all"
               onClick={handleLoadLatest}
            >
               {isLoadingLatest ? <LoadingIcon className="size-5" /> : <IconMingcuteDownFill className="size-5" />}
            </button>
         )}
      </div>
   );
}
