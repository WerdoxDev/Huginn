import type { Snowflake } from "@huginn/shared";

import { useMessage } from "@hooks/api-hooks/messageHooks";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useMemo } from "react";

export default function ReplyingPreview(props: { onCancel?: () => void; channelId: Snowflake; messageId: Snowflake }) {
   // channel id isn't supposed to ever be changed in this component
   const channelId = useMemo(() => props.channelId, []);
   const message = useMessage(channelId, props.messageId)!;
   const author = useUser(message?.authorId);

   return (
      <div className="border-surface bg-primary-900 flex items-center gap-x-2 rounded-t-lg border-2 border-b-0 px-2 py-2 text-white">
         <IconMingcuteCornerUpLeftFill />
         <div>
            Replying to <span className="font-semibold">{author.displayName}</span>
         </div>
         <div className="text-sm text-white/50">(ESC to cancel)</div>
         <button className="bg-negative-100 hover:bg-negative-200 ml-auto cursor-pointer rounded-full p-1" onClick={props.onCancel}>
            <IconMingcuteCloseFill className="size-4" />
         </button>
      </div>
   );
}
