import { Slider } from "@base-ui/react";
import HuginnLabel from "@components/HuginnLabel";
import Tooltip from "@components/tooltip/Tooltip";
import { snowflake, WorkerID } from "@huginnjs/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

const SliderContext = createContext<{
   id: string;
   minValue?: number;
   maxValue?: number;
   step?: number;
   defaultValue?: number;
   value?: number;
   onChange?: (value: number) => void;
   getTooltipText?: (value: number, percentage: number) => string;
}>({
   id: "",
});

export default function HuginnSlider(props: {
   className?: string;
   defaultValue?: number;
   minValue?: number;
   maxValue?: number;
   step?: number;
   children?: ReactNode;
   value?: number;
   onChange?: (value: number) => void;
   getTooltipText?: (value: number, percentage: number) => string;
}) {
   const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));

   return (
      <SliderContext.Provider
         value={{
            id,
            defaultValue: props.defaultValue,
            getTooltipText: props.getTooltipText,
            maxValue: props.maxValue,
            minValue: props.minValue,
            step: props.step,
            value: props.value,
            onChange: props.onChange,
         }}
      >
         <div className={clsx("w-full", props.className)}>{props.children}</div>
      </SliderContext.Provider>
   );
}

function Input(props: { className?: string; backgroundClassName?: string; fillClassName?: string; children?: ReactNode }) {
   const rangeContext = useContext(SliderContext);

   const [ourValue, setOurValue] = useState(rangeContext.defaultValue ?? rangeContext.minValue ?? 0);

   function handleChange(newValue: number) {
      setOurValue(newValue);
      rangeContext.onChange?.(newValue);
   }
   const [showTooltip, setShowTooltip] = useState(false);

   const value = rangeContext.value ?? ourValue;

   return (
      <Slider.Root
         value={value}
         orientation={"horizontal"}
         onValueChange={handleChange}
         className="relative flex h-3 w-full items-center"
         thumbAlignment="edge-client-only"
         min={rangeContext.minValue}
         max={rangeContext.maxValue}
         step={rangeContext.step}
      >
         <Slider.Control
            className="group flex h-full w-full cursor-w-resize items-center"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onTouchStart={(e) => e.stopPropagation()}
         >
            <Slider.Track className={clsx("bg-surface-alt h-1 w-full rounded-full transition-[height] group-hover:h-2", props.backgroundClassName)}>
               <Slider.Indicator className={clsx("bg-primary-500 rounded-full select-none", props.fillClassName)} />
               <Slider.Thumb className="relative z-10 size-3">
                  <Tooltip open={showTooltip}>
                     <Tooltip.Trigger asChild>
                        <div className="absolute size-3 scale-100 cursor-w-resize rounded-full bg-white transition-transform group-hover:scale-150"></div>
                     </Tooltip.Trigger>
                     <Tooltip.Content>
                        {rangeContext.getTooltipText
                           ? rangeContext.getTooltipText(
                                value,
                                Math.floor(
                                   ((value - (rangeContext.minValue ?? 0)) / ((rangeContext.maxValue ?? 100) - (rangeContext.minValue ?? 0))) * 100,
                                ),
                             )
                           : `${value}`}
                     </Tooltip.Content>
                  </Tooltip>
               </Slider.Thumb>
               {props.children}
            </Slider.Track>
         </Slider.Control>
      </Slider.Root>
      // <div className="group relative flex h-4 cursor-pointer items-center" ref={rangeRef} draggable={false}>
      //    <div
      //       className={clsx(
      //          "bg-surface-alt absolute h-1 w-full overflow-hidden rounded-md transition-[height] group-hover:h-2",
      //          props.backgroundClassName,
      //       )}
      //    >
      //       <div className={clsx("bg-surface-alt relative top-0 left-0 h-full w-full", props.backgroundClassName)} ref={rangeTrackRef}>
      //          <div className={clsx("bg-primary-500 h-full", props.fillClassName)} style={{ width: `${percentage}%` }} />
      //       </div>
      //       {props.children}
      //    </div>
      //    <div className="relative mx-1 h-full w-full">
      //       <Tooltip open={showTooltip}>
      //          <Tooltip.Trigger asChild>
      //             <div
      //                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-w-resize rounded-full bg-white transition-[width,height] group-hover:h-5 group-hover:w-5"
      //                style={{ left: `${percentage}%` }}
      //             />
      //          </Tooltip.Trigger>
      //          <Tooltip.Content>{rangeContext.getTooltipText ? rangeContext.getTooltipText(value, percentage) : `${percentage}%`}</Tooltip.Content>
      //       </Tooltip>
      //    </div>
      // </div>
   );
}

function Label(props: { children?: ReactNode }) {
   const rangeContext = useContext(SliderContext);
   return <HuginnLabel htmlFor={rangeContext.id}>{props.children}</HuginnLabel>;
}

HuginnSlider.Input = Input;
HuginnSlider.Label = Label;
