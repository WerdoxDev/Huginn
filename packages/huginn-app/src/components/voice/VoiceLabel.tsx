import { useUser } from "@hooks/api-hooks/userHooks";
import type { GatewayVoiceState, Snowflake } from "@huginn/shared";
import clsx from "clsx";

export function VoiceLabel(props: { isGridView?: boolean; userId: Snowflake; voiceState?: GatewayVoiceState; type: "normal" | "stream" }) {
   const user = useUser(props.userId);

   return (
      <>
         <div className="absolute bottom-2 left-2 z-10 flex overflow-hidden text-white">
            <div
               className={clsx(
                  "bg-negative-300 flex h-8 items-center justify-center gap-x-2 rounded-lg",
                  (props.voiceState?.isAudioMuted || props.voiceState?.isAudioDeafened) && "mr-2 px-2 py-1",
               )}
            >
               {props.voiceState?.isAudioMuted && <IconMingcuteMicOffFill className="size-5" />}
               {props.voiceState?.isAudioDeafened && <IconMingcuteVolumeOffFill className="size-5" />}
            </div>
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
                  "text-text absolute -bottom-10 w-full overflow-hidden text-ellipsis text-nowrap text-center opacity-0 transition-opacity group-hover/element:opacity-100",
               )}
            >
               {user?.displayName}
            </div>
         )}
      </>
   );
}
