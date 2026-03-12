import { useTimeout } from "@hooks/useTimeout";
import { type MouseEvent, useRef, useState } from "react";

import type { SliderProps } from "@/types";

import Slider from "./Slider";

export default function VolumeSlider(props: Omit<SliderProps, "orientation">) {
   const [audioHovering, setAudioHovering] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [isDragging, setIsDragging] = useState(false);
   const previousPercent = useRef(0);
   const { cancel: cancelTimeout, start: startTimeout } = useTimeout(() => setAudioHovering(false), 1000);

   function cancelAudioHoverTimeout() {
      cancelTimeout();
      setAudioHovering(true);
   }

   function startAudioHoverTimeout(e: MouseEvent) {
      e.stopPropagation();
      startTimeout();
   }

   function toggleMute() {
      if (isMuted) {
         setIsMuted(false);
         props.onChange(previousPercent.current);
      } else {
         setIsMuted(true);
         previousPercent.current = props.currentPercent;
         props.onChange(0);
      }
   }

   function updateCurrentPercent(percent: number) {
      props.onChange(percent);
      if (percent !== 0 && isMuted) {
         setIsMuted(false);
      } else if (percent === 0 && !isMuted) {
         setIsMuted(true);
      }
   }

   return (
      <div className="relative flex items-center justify-center select-none">
         <button
            type="button"
            className="shrink-0 cursor-pointer text-white/80 transition-transform hover:text-white active:scale-90"
            onMouseLeave={startAudioHoverTimeout}
            onMouseEnter={cancelAudioHoverTimeout}
            onClick={toggleMute}
         >
            {isMuted ? <IconMingcuteVolumeMuteFill className="size-6" /> : <IconMingcuteVolumeFill className="size-6" />}
         </button>
         {(audioHovering || isDragging) && (
            <div
               className="bg-surface-deep/90 absolute bottom-10 h-24 w-4 rounded-lg p-1 py-1.5"
               onMouseEnter={cancelAudioHoverTimeout}
               onMouseLeave={startAudioHoverTimeout}
            >
               <Slider orientation="vertical" currentPercent={props.currentPercent} onChange={updateCurrentPercent} onDragChanged={setIsDragging} />
            </div>
         )}
      </div>
   );
}
