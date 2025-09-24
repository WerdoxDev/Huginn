import { useVideoDetails } from "../../hooks/useVideoDetails";
import type { HMediaKind } from "@huginn/shared";
import { motion, type Transition } from "motion/react";
import type { RefObject } from "react";

export default function VoiceVideoStats(props: {
   isResizing?: boolean;
   transition: Transition;
   kind?: HMediaKind;
   srcObject?: MediaProvider;
   videoRef: RefObject<HTMLVideoElement | null>;
   hasAudio: boolean;
}) {
   const { estimateFps, height } = useVideoDetails(props.videoRef, props.srcObject);

   return (
      <motion.div
         layout={!props.isResizing ? "position" : false}
         transition={props.transition}
         className="bg-surface-deep absolute right-2 top-2 z-10 flex gap-x-2 rounded-lg px-2 py-1 italic opacity-0 transition-opacity group-hover/element:opacity-100"
      >
         {props.kind === "stream_video" &&
            (props.hasAudio ? (
               <IconMingcuteVolumeFill className="text-positive-100" />
            ) : (
               <IconMingcuteVolumeOffFill className="text-negative-100 size-5" />
            ))}
         <div className="text-sm font-bold text-white/90">
            {height}
            <span className="text-white/60">P</span> {estimateFps}
            <span className="text-white/60"> FPS</span>
         </div>
      </motion.div>
   );
}
