import Tooltip from "@components/tooltip/Tooltip";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

const RangeContext = createContext<{
   id: string;
   minValue?: number;
   maxValue?: number;
   step?: number;
   defaultValue?: number;
   onChange?: (value: number) => void;
   getTooltipText?: (value: number, percentage: number) => string;
}>({
   id: "",
});

export default function HuginnRange(props: {
   className?: string;
   defaultValue?: number;
   minValue?: number;
   maxValue?: number;
   step?: number;
   children?: ReactNode;
   onChange?: (value: number) => void;
   getTooltipText?: (value: number, percentage: number) => string;
}) {
   const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));

   return (
      <RangeContext.Provider
         value={{
            id,
            defaultValue: props.defaultValue,
            getTooltipText: props.getTooltipText,
            maxValue: props.maxValue,
            minValue: props.minValue,
            step: props.step,
            onChange: props.onChange,
         }}
      >
         <div className={clsx("w-full", props.className)}>{props.children}</div>
      </RangeContext.Provider>
   );
}

function Input(props: { className?: string; backgroundClassName?: string; fillClassName?: string; children?: ReactNode }) {
   const rangeContext = useContext(RangeContext);

   const rangeRef = useRef<HTMLDivElement>(null);
   const rangeTrackRef = useRef<HTMLDivElement>(null);
   const minValue = rangeContext.minValue ?? 0;
   const maxValue = rangeContext.maxValue ?? 100;
   const step = rangeContext.step ?? 1;
   const [value, setValue] = useState(rangeContext.defaultValue ?? minValue);
   const isDragging = useRef(false);
   const isHovering = useRef(false);
   const [showTooltip, setShowTooltip] = useState(false);
   const lastValue = useRef(value);

   // Calculate percentage for display (0-100)
   const percentage = Math.floor(((value - minValue) / (maxValue - minValue)) * 100);

   useEffect(() => {
      if (lastValue.current !== value) {
         rangeContext.onChange?.(value);
         lastValue.current = value;
      }
   }, [value]);

   useEffect(() => {
      const controller = new AbortController();

      rangeRef.current?.addEventListener(
         "mousedown",
         (e) => {
            isDragging.current = true;
            setShowTooltip(true);
            updateRange(e.clientX);
         },
         { signal: controller.signal },
      );

      rangeRef.current?.addEventListener("mouseenter", () => {
         isHovering.current = true;
         setShowTooltip(true);
      });

      rangeRef.current?.addEventListener("mouseleave", () => {
         isHovering.current = false;
         if (!isDragging.current) {
            setShowTooltip(false);
         }
      });

      document.addEventListener(
         "mousemove",
         (e) => {
            if (!isDragging.current) return;
            updateRange(e.clientX);
         },
         { signal: controller.signal },
      );

      document.addEventListener(
         "mouseup",
         () => {
            if (!isHovering.current) {
               setShowTooltip(false);
            }
            isDragging.current = false;
         },
         { signal: controller.signal },
      );

      document.addEventListener(
         "mouseleave",
         () => {
            isDragging.current = false;
            setShowTooltip(false);
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort?.();
      };
   }, []);

   function updateRange(x: number) {
      if (!rangeTrackRef.current) {
         return;
      }

      const rangeRect = rangeTrackRef.current.getBoundingClientRect();
      let position = x - rangeRect.left;

      if (position < 0) {
         position = 0;
      } else if (position > rangeRect.width) {
         position = rangeRect.width;
      }

      // Calculate the actual value based on min/max range
      const positionPercentage = position / rangeRect.width;
      const rawValue = minValue + positionPercentage * (maxValue - minValue);

      // Snap to step
      const steppedValue = Math.round(rawValue / step) * step;

      // Clamp to min/max bounds
      const clampedValue = Math.max(minValue, Math.min(maxValue, steppedValue));
      console.log(clampedValue);

      setValue(clampedValue);
   }

   return (
      <div className="group relative flex h-8 cursor-pointer items-center" ref={rangeRef} draggable={false}>
         <div
            className={clsx(
               "bg-surface-alt absolute h-1 w-full overflow-hidden rounded-md transition-[height] group-hover:h-2",
               props.backgroundClassName,
            )}
         >
            <div className={clsx("bg-surface-alt relative left-0 top-0 h-full w-full", props.backgroundClassName)} ref={rangeTrackRef}>
               <div className={clsx("bg-primary-500 h-full", props.fillClassName)} style={{ width: `${percentage}%` }} />
            </div>
            {props.children}
         </div>
         <div className="relative mx-1 h-full w-full">
            <Tooltip open={showTooltip}>
               <Tooltip.Trigger asChild>
                  <div
                     className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-w-resize rounded-full bg-white transition-[width,height] group-hover:h-5 group-hover:w-5"
                     style={{ left: `${percentage}%` }}
                  />
               </Tooltip.Trigger>
               <Tooltip.Content>{rangeContext.getTooltipText ? rangeContext.getTooltipText(value, percentage) : `${percentage}%`}</Tooltip.Content>
            </Tooltip>
         </div>
      </div>
   );
}

function Label(props: { children?: ReactNode }) {
   const rangeContext = useContext(RangeContext);

   return (
      <label htmlFor={rangeContext.id} className="text-text mb-2 select-none text-xs font-medium uppercase opacity-90">
         {props.children}
      </label>
   );
}

HuginnRange.Input = Input;
HuginnRange.Label = Label;
