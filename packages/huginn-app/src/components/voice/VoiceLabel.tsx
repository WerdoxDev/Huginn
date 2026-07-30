import type { GatewayVoiceState, Snowflake, VoicePreference } from "@huginnjs/shared";

import { useUser } from "@hooks/api-hooks/userHooks";
import clsx from "clsx";

export function VoiceLabel(props: {
   isGridView?: boolean;
   userId: Snowflake;
   voiceState?: GatewayVoiceState;
   voicePreference?: VoicePreference;
   type: "normal" | "stream";
}) {
   const user = useUser(props.userId);

   const isMuted =
      (props.type === "normal" && props.voicePreference?.isMicrophoneMuted) || (props.type === "stream" && props.voicePreference?.isStreamMuted);

   return (
      <>
         <div className={clsx("absolute z-10 flex gap-x-1 overflow-hidden text-white", props.isGridView ? "bottom-2 left-2" : "right-3 bottom-3")}>
            {(((props.voiceState?.isAudioDeafened || props.voiceState?.isAudioMuted) && props.type === "normal") || (isMuted && props.type)) && (
               <div
                  className={clsx("size-8 p-1.5", props.isGridView ? "rounded-lg" : "rounded-full", isMuted ? "bg-negative-700" : "bg-negative-500")}
               >
                  {isMuted ? (
                     <IconMingcuteVolumeMuteFill className="size-full" />
                  ) : props.voiceState?.isAudioDeafened && props.type === "normal" ? (
                     <IconMingcuteVolumeOffFill className="size-full" />
                  ) : (
                     props.voiceState?.isAudioMuted && props.type === "normal" && <IconMingcuteMicOffFill className="size-full" />
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
