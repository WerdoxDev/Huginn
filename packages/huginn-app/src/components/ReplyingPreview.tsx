import type { Snowflake } from "@huginnjs/shared";

import { useMessage } from "@hooks/api-hooks/messageHooks";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useIsMobile } from "@hooks/useIsMobile";

import MessageBoxPreviewBar, { type MessageBoxPreviewBarProps } from "./MessageBoxPreviewBar";

export default function ReplyingPreview(props: MessageBoxPreviewBarProps & { onCancel?: () => void; channelId: Snowflake; messageId?: Snowflake }) {
   return (
      <MessageBoxPreviewBar {...props}>
         {props.messageId && <ReplyingContent channelId={props.channelId} messageId={props.messageId} onCancel={props.onCancel} />}
      </MessageBoxPreviewBar>
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
