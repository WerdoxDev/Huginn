import MessageRenderer from "@components/message/MessageRenderer";
import type { Snowflake } from "@huginn/shared";
import clsx from "clsx";
import moment from "moment";
import { createContext } from "react";
import type { MessageRendererProps, MessageRenderInfo } from "@/types";

export const MessageContext = createContext<{
   renderInfo: MessageRenderInfo;
   nextRenderInfo?: MessageRenderInfo;
   lastRenderInfo?: MessageRenderInfo;
   onVisibilityChanged: (messageId: Snowflake, visible: boolean) => void;
   ref: React.RefObject<HTMLLIElement | null>;
}>(
   // biome-ignore lint/style/noNonNullAssertion: The initialization must be with undefined
   undefined!,
);

export function MessageProvider(props: MessageRendererProps) {
   return (
      <MessageContext.Provider value={{ ...props }}>
         {props.renderInfo.unread && !props.renderInfo.newDate && (
            <li
               className={clsx(
                  "bg-negative-300 pointer-events-none relative ml-2 mr-10 flex h-px shrink-0 items-center justify-center",
                  props.lastRenderInfo ? "my-1" : "mb-1",
               )}
            >
               <div className="bg-negative-300 absolute right-0 z-10 -mr-10 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold uppercase text-white">
                  new
               </div>
            </li>
         )}
         {!props.renderInfo.message.preview && props.renderInfo.newDate && (
            <li
               className={clsx(
                  "relative flex h-0 shrink-0 items-center justify-center border-t text-center text-xs font-semibold",
                  props.lastRenderInfo ? "my-5" : "mb-5 mt-2",
                  props.renderInfo.unread ? "border-t-negative-300 text-negative-100 ml-2 mr-10" : "border-t-text/25 text-text/70 mx-2",
               )}
            >
               <span className={clsx("bg-surface-deep px-2", props.renderInfo.unread && "ml-10")}>
                  {moment(props.renderInfo.message.timestamp).format("DD. MMMM YYYY")}
               </span>
               {props.renderInfo.unread && (
                  <div className="bg-negative-300 absolute right-0 -mr-8 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold uppercase text-white">
                     new
                  </div>
               )}
            </li>
         )}
         <MessageRenderer />
      </MessageContext.Provider>
   );
}
