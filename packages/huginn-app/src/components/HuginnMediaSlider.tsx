import { Slider as BaseSlider } from "@base-ui/react";
import clsx from "clsx";

import type { SliderProps } from "@/types";

export default function HuginnMediaSlider(props: SliderProps) {
   const isVertical = props.orientation === "vertical";

   return (
      <BaseSlider.Root
         value={props.currentPercent}
         orientation={props.orientation}
         onValueChange={props.onChange}
         className={clsx("group relative", isVertical ? "h-full w-2" : "h-2 w-full")}
         thumbAlignment="edge-client-only"
         data-ignore-swipe
      >
         <BaseSlider.Control className="group/slider h-full w-full cursor-pointer">
            <BaseSlider.Track className="h-full w-full rounded-full bg-white/10">
               {props.bufferedPercent !== undefined && (
                  <div
                     className={clsx("absolute rounded-full bg-white/10", isVertical ? "inset-x-0 bottom-0" : "inset-y-0 left-0")}
                     style={isVertical ? { height: `${props.bufferedPercent}%` } : { width: `${props.bufferedPercent}%` }}
                  />
               )}
               <BaseSlider.Indicator className={clsx("bg-primary-500 select-none", isVertical ? "rounded-b-full" : "rounded-l-full")} />
               <BaseSlider.Thumb className="relative size-2">
                  <div className="absolute size-2 scale-100 rounded-full bg-white transition-transform group-hover/slider:scale-150 group-active/slider:scale-150"></div>
               </BaseSlider.Thumb>
            </BaseSlider.Track>
         </BaseSlider.Control>
      </BaseSlider.Root>
   );
}
