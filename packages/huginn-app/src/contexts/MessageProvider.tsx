import type { Snowflake } from "@huginn/shared";

import MessageRenderer from "@components/message/MessageRenderer";
import { useChannelStore } from "@stores/channelStore";
import clsx from "clsx";
import moment from "moment";
import { createContext, useCallback, type RefObject } from "react";

import type { ProcessedMessage } from "@/types";

type MessageProviderProps = {
   channelId?: Snowflake;
   message: ProcessedMessage;
   nextMessage?: ProcessedMessage;
   lastMessage?: ProcessedMessage;
   onVisibilityChanged?: (messageId: Snowflake, visible: boolean) => void;
   options?: {
      idPrefix?: string;
      hideBackground?: boolean;
      disableContextMenu?: boolean;
   };
   ref: RefObject<HTMLLIElement | null>;
};

type MessageContextType = Omit<MessageProviderProps, "channelId"> & {
   onReferencedMessageClick?: (messageId: Snowflake) => void;
};

export const MessageContext = createContext<MessageContextType>(undefined!);

export function MessageProvider(props: MessageProviderProps) {
   const { requestJumpToMessage } = useChannelStore();
   const { channelId, ...contextProps } = props;
   const onReferencedMessageClick = useCallback(
      (messageId: Snowflake) => {
         if (!channelId) return;
         requestJumpToMessage(channelId, messageId);
      },
      [channelId, requestJumpToMessage],
   );

   return (
      <MessageContext.Provider value={{ ...contextProps, onReferencedMessageClick }}>
         {contextProps.message.isUnread && !contextProps.message.hasNewDate && (
            <li
               className={clsx(
                  "bg-negative-300 pointer-events-none relative mr-10 flex h-px shrink-0 items-center justify-center",
                  contextProps.lastMessage ? "my-1" : "mb-1",
               )}
            >
               <div className="bg-negative-300 absolute right-0 z-10 -mr-10 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold text-white uppercase">
                  new
               </div>
            </li>
         )}
         {contextProps.message.hasNewDate && (
            <li
               className={clsx(
                  "relative flex h-0 shrink-0 items-center justify-center border-t border-b text-center text-xs font-medium",
                  contextProps.lastMessage ? "my-5" : "mt-2 mb-5",
                  contextProps.message.isUnread ? "border-negative-300 text-negative-100" : "border-text/25 text-text/70",
               )}
            >
               <span className="bg-surface-deep px-2">{moment(contextProps.message.timestamp).format("D MMMM YYYY")}</span>
               {contextProps.message.isUnread && (
                  <div className="bg-negative-300 absolute right-0 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold text-white uppercase">
                     new
                  </div>
               )}
            </li>
         )}
         <MessageRenderer />
      </MessageContext.Provider>
   );
}
