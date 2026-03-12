import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import type { SliderProps } from "@/types";

const MIN_SIZE = 6;
const KNOB_OFFSET = MIN_SIZE / 2;

export default function Slider(props: SliderProps) {
   const [isHovering, setIsHovering] = useState(false);
   const [isDragging, setIsDragging] = useState(false);
   const sliderRef = useRef<HTMLDivElement>(null);

   function getVisualSize(percent: number) {
      if (!sliderRef.current) return `${percent}%`;
      const rect = sliderRef.current.getBoundingClientRect();
      const availableSize = props.orientation === "horizontal" ? rect.width - MIN_SIZE : rect.height - MIN_SIZE;
      const additionalSize = (availableSize * percent) / 100;
      return `${MIN_SIZE + additionalSize}px`;
   }

   function getKnobPosition(percent: number) {
      if (!sliderRef.current) return `${percent}%`;
      const rect = sliderRef.current.getBoundingClientRect();
      const availableSize = props.orientation === "horizontal" ? rect.width - MIN_SIZE : rect.height - MIN_SIZE;
      const progressSize = (availableSize * percent) / 100;
      const adjustedSize = Math.max(0, Math.min(MIN_SIZE + progressSize - KNOB_OFFSET, MIN_SIZE + availableSize - KNOB_OFFSET));
      return `${adjustedSize}px`;
   }

   function handleMouseDown(e: React.MouseEvent) {
      setIsDragging(true);
      updatePercent(props.orientation === "horizontal" ? e.clientX : e.clientY);
   }

   function updatePercent(clientPosition: number) {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();

      const clickPosition =
         props.orientation === "horizontal"
            ? clientPosition - rect.left - MIN_SIZE + KNOB_OFFSET
            : rect.bottom - clientPosition - MIN_SIZE + KNOB_OFFSET;

      const availableSize = props.orientation === "horizontal" ? rect.width - MIN_SIZE : rect.height - MIN_SIZE;
      const percent = Math.max(0, Math.min(100, (clickPosition / availableSize) * 100));
      props.onChange(percent);
   }

   const [, setForceUpdate] = useState(0);
   useEffect(() => {
      const handleResize = () => setForceUpdate((prev) => prev + 1);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   useEffect(() => {
      function handleMouseMove(e: MouseEvent) {
         if (isDragging) {
            updatePercent(props.orientation === "horizontal" ? e.clientX : e.clientY);
         }
      }

      function handleMouseUp() {
         setIsDragging(false);
      }

      if (isDragging) {
         document.addEventListener("mousemove", handleMouseMove);
         document.addEventListener("mouseup", handleMouseUp);
      }

      return () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
      };
   }, [isDragging, props.onChange]);

   useEffect(() => {
      props.onDragChanged?.(isDragging);
   }, [isDragging]);

   useEffect(() => {
      props.onHoverChanged?.(isHovering);
   }, [isHovering]);

   const isVertical = props.orientation === "vertical";

   return (
      <div
         ref={sliderRef}
         className={clsx("group relative cursor-pointer select-none", isVertical ? "h-full w-2" : "h-2 w-full")}
         onMouseEnter={() => setIsHovering(true)}
         onMouseLeave={() => setIsHovering(false)}
         onMouseDown={handleMouseDown}
      >
         {/* Background track */}
         <div className="absolute inset-0 rounded-full bg-white/20" />

         {/* Buffered progress */}
         {props.bufferedPercent !== undefined && (
            <div
               draggable={false}
               className={clsx("absolute rounded-full bg-white/10", isVertical ? "inset-x-0 bottom-0" : "inset-y-0 left-0")}
               style={isVertical ? { height: getVisualSize(props.bufferedPercent) } : { width: getVisualSize(props.bufferedPercent) }}
            />
         )}

         {/* Current progress */}
         <div
            draggable={false}
            className={clsx("bg-primary-500 absolute rounded-full", isVertical ? "inset-x-0 bottom-0" : "inset-y-0 left-0")}
            style={isVertical ? { height: getVisualSize(props.currentPercent) } : { width: getVisualSize(props.currentPercent) }}
         />

         {/* Hover/Drag knob */}
         <div
            draggable={false}
            className={clsx(
               "bg-text absolute h-3 w-3 rounded-full shadow-lg transition-transform",
               isVertical ? "left-1/2 origin-bottom-left" : "top-1/2 origin-top-left",
               isHovering || isDragging ? "scale-100" : "scale-0",
            )}
            style={
               isVertical
                  ? {
                       bottom: getKnobPosition(props.currentPercent),
                       transform: `translate(-50%, 50%)`,
                    }
                  : {
                       left: getKnobPosition(props.currentPercent),
                       transform: `translate(-50%, -50%)`,
                    }
            }
         />
      </div>
   );
}
