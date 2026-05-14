import type { Snowflake } from "@huginn/shared";

import MessageRenderer from "@components/message/MessageRenderer";
import clsx from "clsx";
import moment from "moment";
import { createContext, type RefObject } from "react";

import type { ProcessedMessage } from "@/types";

type MessageContextType = {
   message: ProcessedMessage;
   nextMessage?: ProcessedMessage;
   lastMessage?: ProcessedMessage;
   onVisibilityChanged?: (messageId: Snowflake, visible: boolean) => void;
   onReferencedMessageClick?: (messageId: Snowflake) => Promise<void>;
   ref: RefObject<HTMLLIElement | null>;
};

export const MessageContext = createContext<MessageContextType>(undefined!);

export function MessageProvider(props: MessageContextType) {
   return (
      <MessageContext.Provider value={{ ...props }}>
         {props.message.isUnread && !props.message.hasNewDate && (
            <li
               className={clsx(
                  "bg-negative-300 pointer-events-none relative mr-10 flex h-px shrink-0 items-center justify-center",
                  props.lastMessage ? "my-1" : "mb-1",
               )}
            >
               <div className="bg-negative-300 absolute right-0 z-10 -mr-10 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold text-white uppercase">
                  new
               </div>
            </li>
         )}
         {props.message.hasNewDate && (
            <li
               className={clsx(
                  "relative flex h-0 shrink-0 items-center justify-center border-t border-b text-center text-xs font-medium",
                  props.lastMessage ? "my-5" : "mt-2 mb-5",
                  props.message.isUnread ? "border-negative-300 text-negative-100" : "border-text/25 text-text/70",
               )}
            >
               <span className="bg-surface-deep px-2">{moment(props.message.timestamp).format("D MMMM YYYY")}</span>
               {props.message.isUnread && (
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
