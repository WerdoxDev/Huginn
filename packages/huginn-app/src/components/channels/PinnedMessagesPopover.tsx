import LoadingIcon from "@components/LoadingIcon";
import MessageRenderer from "@components/message/MessageRenderer";
import HuginnPopover from "@components/popover/HuginnPopover";
import Tooltip from "@components/tooltip/Tooltip";
import { MessageContext } from "@contexts/MessageProvider";
import { usePinnedMessages } from "@hooks/api-hooks/messageHooks";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { type Snowflake } from "@huginn/shared";
import { useMemo, useState } from "react";

import type { AppMessage, ProcessedMessage } from "@/types";

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
   return (
      <HuginnPopover open={isOpen} onOpenChange={setIsOpen}>
         <Tooltip hideOnMobile>
            <Tooltip.Trigger asChild>
               <HuginnPopover.Trigger className="text-text/80 hover:text-text h-full">
                  <IconMingcutePinFill className="size-topbar-icon" />
               </HuginnPopover.Trigger>
            </Tooltip.Trigger>
            <Tooltip.Content>Pinned Messages</Tooltip.Content>
         </Tooltip>
         <PinnedMessagesPanel channelId={props.channelId} isOpen={isOpen} />
      </HuginnPopover>
   );
}

function PinnedMessagesPanel(props: { channelId: Snowflake; isOpen: boolean }) {
   const { data, isLoading, isError } = usePinnedMessages(props.channelId, { enabled: props.isOpen });
   const { setRef } = useDynamicRefs<HTMLLIElement>();

   const pinnedMessages = useMemo(() => data?.map((pin) => pin.message) ?? [], [data]);
   const processedMessages = useMemo(() => processMessages(pinnedMessages), [pinnedMessages]);

   return (
      <HuginnPopover.Panel
         align="end"
         className="bg-surface-deep border-surface z-40 w-105 overflow-hidden rounded-lg border shadow-xl"
         side="bottom"
         sideGap={16}
      >
         <div className="text-text flex items-center gap-x-2 px-4 py-4">
            <IconMingcutePinFill className="size-5" />
            <div className="text-lg font-bold">Pinned Messages</div>
         </div>
         <div className="bg-surface h-0.5 w-full" />
         <div className="bg-surface-deep max-h-[70vh] overflow-y-auto py-3">
            {isLoading && (
               <div className="text-text/70 flex items-center justify-center gap-x-2 py-6">
                  <LoadingIcon className="size-10" />
               </div>
            )}
            {isError && !isLoading && <div className="text-text/70 flex items-center justify-center py-6">Failed to load pinned messages.</div>}
            {!isLoading && !isError && pinnedMessages.length === 0 && (
               <div className="text-text/70 flex items-center justify-center py-6">No pinned messages yet.</div>
            )}
            {!isLoading && !isError && pinnedMessages.length > 0 && (
               <ol className="min-h-0 space-y-1 overflow-hidden pr-0 pb-2">
                  {processedMessages.map((message) => (
                     <MessageContext.Provider
                        key={message.id}
                        value={{
                           idPrefix: "pinned_",
                           message,
                           ref: setRef(message.id),
                           lastMessage: undefined,
                           nextMessage: undefined,
                        }}
                     >
                        <MessageRenderer />
                     </MessageContext.Provider>
                  ))}
               </ol>
            )}
         </div>
      </HuginnPopover.Panel>
   );
}
