import type { Snowflake } from "@huginn/shared";

import { useMessage } from "@hooks/api-hooks/messageHooks";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useIsMobile } from "@hooks/useIsMobile";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";

export default function ReplyingPreview(props: { onCancel?: () => void; channelId: Snowflake; messageId?: Snowflake; show: boolean }) {
   const lastMessageId = useRef(props.messageId);

   if (props.messageId) {
      lastMessageId.current = props.messageId;
   }

   return (
      <AnimatePresence>
         {props.show && (
            <motion.div
               initial={{ opacity: 0, borderBottomWidth: 0, height: 0 }}
               animate={{ opacity: 1, borderBottomWidth: 1, height: "2.5rem" }}
               exit={{ opacity: 0, height: 0, borderBottomWidth: 0 }}
               transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
               className="border-surface flex items-center gap-x-2 pr-2 pl-4 text-sm"
            >
               {lastMessageId.current && <ReplyingContent channelId={props.channelId} messageId={lastMessageId.current} onCancel={props.onCancel} />}
            </motion.div>
         )}
      </AnimatePresence>
   );
}

function ReplyingContent(props: { channelId: Snowflake; messageId: Snowflake; onCancel?: () => void }) {
   const message = useMessage(props.channelId, props.messageId)!;
   const author = useUser(message.authorId);
   const isMobile = useIsMobile();

   return (
      <>
         <IconMingcuteCornerUpLeftFill className="text-caution-300 size-4 shrink-0" />
         <span className="text-white/80">
            Replying to <span className="font-semibold">{author?.displayName}</span>
         </span>
         {!isMobile && <span className="text-xs text-white/30 italic">escape to cancel</span>}
         <button
            className="hover:bg-surface ml-auto cursor-pointer rounded-md p-1 text-white/70 transition-colors hover:text-white"
            onClick={props.onCancel}
            type="button"
            data-keyboard-no-close
         >
            <IconMingcuteCloseFill className="size-3.5" />
         </button>
      </>
   );
}
