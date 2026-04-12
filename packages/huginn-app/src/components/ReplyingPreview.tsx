import type { Snowflake } from "@huginn/shared";

import { Transition } from "@headlessui/react";
import { useMessage } from "@hooks/api-hooks/messageHooks";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useRef } from "react";

export default function ReplyingPreview(props: { onCancel?: () => void; channelId: Snowflake; messageId?: Snowflake; show: boolean }) {
   const lastMessageId = useRef(props.messageId);

   if (props.messageId) {
      lastMessageId.current = props.messageId;
   }

   return (
      <Transition show={props.show}>
         <div className="border-surface flex items-center gap-x-2 border-b py-2 pr-2 pl-4 text-sm duration-150 data-closed:h-0 data-closed:py-0 data-closed:opacity-0">
            {lastMessageId.current && <ReplyingContent channelId={props.channelId} messageId={lastMessageId.current} onCancel={props.onCancel} />}
         </div>
      </Transition>
   );
}

function ReplyingContent(props: { channelId: Snowflake; messageId: Snowflake; onCancel?: () => void }) {
   const message = useMessage(props.channelId, props.messageId)!;
   const author = useUser(message.authorId);

   return (
      <>
         <IconMingcuteCornerUpLeftFill className="text-primary-400 size-4 shrink-0" />
         <span className="text-white/80">
            Replying to <span className="font-semibold">{author?.displayName}</span>
         </span>
         <span className="text-xs text-white/30 italic">escape to cancel</span>
         <button
            className="hover:bg-surface ml-auto cursor-pointer rounded-md p-1 text-white/70 transition-colors hover:text-white"
            onClick={props.onCancel}
            type="button"
         >
            <IconMingcuteCloseFill className="size-3.5" />
         </button>
      </>
   );
}
