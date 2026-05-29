import LoadingIcon from "@components/LoadingIcon";
import HuginnPopover from "@components/popover/HuginnPopover";
import Tooltip from "@components/tooltip/Tooltip";
import { MessageProvider } from "@contexts/MessageProvider";
import { usePinnedMessages } from "@hooks/api-hooks/messageHooks";
import { useUnpinMessage } from "@hooks/mutations/useUnpinMessage";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { type Snowflake } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import type { AppMessage, ProcessedMessage } from "@/types";

import ModalCloseButton from "../button/ModalCloseButton";

function processMessages(messages: AppMessage[]): ProcessedMessage[] {
   return messages.map((message) => ({
      ...message,
      hasNewMinute: false,
      hasNewDate: false,
      hasNewAuthor: true,
      isActionType: false,
      isReplyType: false,
      isUnread: false,
      isEditing: false,
      isReplying: false,
      isJumpHighlighted: false,
   }));
}

export default function PinnedMessagesPopover(props: { channelId: Snowflake }) {
   const [isOpen, setIsOpen] = useState(false);
   const { requestJumpToMessage } = useChannelStore();

   const handleMessageClick = useCallback(
      (messageId: Snowflake) => {
         requestJumpToMessage(props.channelId, messageId);
         setIsOpen(false);
      },
      [props.channelId, requestJumpToMessage],
   );

   return (
      <HuginnPopover open={isOpen} onOpenChange={setIsOpen} modal>
         <Tooltip hideOnMobile>
            <Tooltip.Trigger asChild>
               <HuginnPopover.Trigger className="text-text/80 hover:text-text h-full">
                  <IconMingcutePinFill className="size-topbar-icon" />
               </HuginnPopover.Trigger>
            </Tooltip.Trigger>
            <Tooltip.Content>Pinned Messages</Tooltip.Content>
         </Tooltip>
         <PinnedMessagesPanel channelId={props.channelId} isOpen={isOpen} onMessageClick={handleMessageClick} />
      </HuginnPopover>
   );
}

function PinnedMessagesPanel(props: { channelId: Snowflake; isOpen: boolean; onMessageClick: (messageId: Snowflake) => void }) {
   const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = usePinnedMessages(props.channelId, {
      enabled: props.isOpen,
   });
   const { setRef } = useDynamicRefs<HTMLLIElement>();

   const allPins = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data]);
   const { updateModals } = useModals();
   const unpinMessageMutation = useUnpinMessage();

   const pinnedMessages = useMemo(() => allPins.map((pin) => pin.message), [allPins]);
   const processedMessages = useMemo(() => processMessages(pinnedMessages), [pinnedMessages]);

   const onScroll = useCallback(
      async (event: React.UIEvent<HTMLDivElement>) => {
         const scroller = event.currentTarget;
         const isAtBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 20;

         if (!isAtBottom || isFetchingNextPage || !hasNextPage) return;
         await fetchNextPage();
      },
      [fetchNextPage, hasNextPage, isFetchingNextPage],
   );

   function handleDeletePin(e: React.MouseEvent, messageId: Snowflake) {
      e.stopPropagation();
      updateModals({
         info: {
            isOpen: true,
            title: "Unpin Message",
            text: "Are you sure you want to unpin this message?",
            status: "info",
            action: {
               confirm: {
                  text: "Unpin",
                  async callback() {
                     await unpinMessageMutation.mutateAsync({ channelId: props.channelId, messageId });
                     updateModals({ info: { isOpen: false } });
                  },
               },
               cancel: {
                  text: "Cancel",
                  callback: () => {
                     updateModals({ info: { isOpen: false } });
                  },
               },
            },
         },
      });
   }

   return (
      <HuginnPopover.Panel align="end" className="w-105 overflow-hidden" side="bottom" sideGap={16}>
         <div className="text-text flex items-center gap-x-2 px-4 py-4">
            <IconMingcutePinFill className="size-5" />
            <div className="text-lg font-bold">Pinned Messages</div>
         </div>
         <div className="bg-surface h-0.5 w-full" />
         <div className="bg-surface-deep scroll-super-thin max-h-[70vh] overflow-y-scroll py-2 pl-2" onScroll={onScroll}>
            {isLoading && (
               <div className="text-text/70 flex h-20 items-center justify-center gap-x-2">
                  <LoadingIcon className="size-10" />
               </div>
            )}
            {isError && !isLoading && <div className="text-text/70 flex items-center justify-center py-6">Failed to load pinned messages.</div>}
            {!isLoading && !isError && pinnedMessages.length === 0 && (
               <div className="text-text/70 flex h-20 items-center justify-center">No pinned messages yet.</div>
            )}
            {!isLoading && !isError && pinnedMessages.length > 0 && (
               <ol className="flex flex-col gap-y-2 overflow-hidden">
                  {processedMessages.map((message, index) => (
                     <div
                        className="bg-surface-alt hover:bg-surface relative cursor-pointer rounded-lg transition-colors"
                        key={message.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => props.onMessageClick(message.id)}
                        onKeyDown={(event) => {
                           if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              props.onMessageClick(message.id);
                           }
                        }}
                     >
                        <MessageProvider
                           key={message.id}
                           channelId={props.channelId}
                           message={message}
                           ref={setRef(message.id)}
                           lastMessage={processedMessages[index - 1]}
                           nextMessage={processedMessages[index + 1]}
                           options={{ hideBackground: true, disableContextMenu: true, idPrefix: "pinned_" }}
                        />
                        <div className="absolute top-2 right-2 flex gap-x-1">
                           <button className="bg-surface-deep hover:bg-surface-alt flex cursor-pointer items-center justify-center rounded-md px-2 py-1 text-sm text-white/70 transition-colors outline-none hover:text-white">
                              Jump
                           </button>

                           <button
                              onClick={(e) => handleDeletePin(e, message.id)}
                              className="bg-surface-deep hover:bg-surface-alt flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-white/70 transition-colors outline-none hover:text-white"
                           >
                              <IconMingcuteCloseFill className="size-4" />
                           </button>
                        </div>
                     </div>
                  ))}
               </ol>
            )}
            {isFetchingNextPage && (
               <div className="flex items-center justify-center py-2">
                  <LoadingIcon className="size-10" />
               </div>
            )}
         </div>
      </HuginnPopover.Panel>
   );
}
