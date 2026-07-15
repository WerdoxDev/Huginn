import type { GatewayVoiceState, Snowflake } from "@huginn/shared";

import { useUser } from "@hooks/api-hooks/userHooks";
import clsx from "clsx";

export function VoiceLabel(props: { isGridView?: boolean; userId: Snowflake; voiceState?: GatewayVoiceState; type: "normal" | "stream" }) {
   const user = useUser(props.userId);

   return (
      <>
         <div className={clsx("absolute bottom-3 z-10 flex gap-x-2 overflow-hidden text-white", props.isGridView ? "left-2" : "right-3")}>
            {(props.voiceState?.isAudioDeafened || props.voiceState?.isAudioMuted) && (
               <div className={clsx("bg-negative-500 size-8 p-1.5", props.isGridView ? "rounded-lg" : "rounded-full")}>
                  {props.voiceState?.isAudioDeafened ? (
                     <IconMingcuteVolumeOffFill className="size-full" />
                  ) : (
                     props.voiceState?.isAudioMuted && <IconMingcuteMicOffFill className="size-full" />
                  )}
               </div>
            )}
            {props.isGridView && (
               <div className="bg-surface-deep flex items-center justify-center gap-x-2 rounded-lg px-2 py-1 text-white opacity-0 transition-opacity group-hover/wrapper:opacity-100">
                  {props.type === "stream" && props.voiceState?.isScreenSharing ? (
                     <IconMingcuteMonitorFill className="size-5" />
                  ) : props.type === "stream" && props.voiceState?.isAudioStreaming ? (
                     <IconMingcuteVolumeFill className="size-5" />
                  ) : (
                     props.voiceState?.isCameraOn && <IconMingcuteCamera2Fill className="size-5" />
                  )}
                  {user?.displayName}
               </div>
            )}
         </div>
         {!props.isGridView && (
            <div
               className={clsx(
                  "text-text absolute -bottom-8 -mb-1 w-full truncate pb-1 text-center opacity-0 transition-opacity group-hover/wrapper:opacity-100",
               )}
            >
               {user?.displayName}
            </div>
         )}
      </>
   );
}
