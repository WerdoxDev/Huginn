import type { HMediaKind } from "@huginnjs/shared";

import { useMemo, type RefObject } from "react";

import { useVideoDetails } from "../../hooks/useVideoDetails";

export default function VoiceVideoStats(props: {
   kind?: HMediaKind;
   track?: MediaStreamTrack;
   videoRef: RefObject<HTMLVideoElement | null>;
   hasAudio: boolean;
}) {
   const srcObject = useMemo(() => (props.track ? new MediaStream([props.track]) : undefined), [props.track]);
   const { estimateFps, height } = useVideoDetails(props.videoRef, srcObject);

   return (
      <div className="bg-surface-deep absolute top-2 right-2 z-10 flex items-center justify-center gap-x-1 rounded-lg px-2 py-1 opacity-0 transition-opacity group-hover/element:opacity-100">
         {props.kind === "stream_video" &&
            (props.hasAudio ? (
               <IconMingcuteVolumeFill className="text-positive-300 size-4" />
            ) : (
               <IconMingcuteVolumeOffFill className="text-negative-300 size-4" />
            ))}
         <div className="flex items-center justify-center gap-x-1 text-xs text-white">
            <div className="w-10 text-center">
               {height}
               <span className="text-white/60">P</span>
            </div>
            <div className="bg-surface h-3 w-0.5 shrink-0" />
            <div className="w-12 text-center">
               {estimateFps}
               <span className="text-white/60"> FPS</span>
            </div>
         </div>
      </div>
   );
}
