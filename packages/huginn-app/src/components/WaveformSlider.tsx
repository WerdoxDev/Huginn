import { Slider as BaseSlider } from "@base-ui/react";
import { useId, useMemo } from "react";

import type { SliderProps } from "@/types";

import { decodeAudioWaveform } from "@/lib/audio-waveform";

import HuginnMediaSlider from "./HuginnMediaSlider";

const BAR_WIDTH = 4;
const BAR_GAP = 2;
const WAVEFORM_HEIGHT = 24;
const MINIMUM_BAR_HEIGHT = 3;

function WaveformBars(props: { samples: Uint8Array }) {
   return Array.from(props.samples, (sample, index) => {
      const height = MINIMUM_BAR_HEIGHT + (sample / 255) * (WAVEFORM_HEIGHT - MINIMUM_BAR_HEIGHT);

      return <rect key={index} x={index * (BAR_WIDTH + BAR_GAP)} y={(WAVEFORM_HEIGHT - height) / 2} width={BAR_WIDTH} height={height} rx={1} />;
   });
}

export default function WaveformSlider(props: SliderProps & { waveform?: string }) {
   const clipId = useId();
   const samples = useMemo(() => (props.waveform ? decodeAudioWaveform(props.waveform) : undefined), [props.waveform]);

   if (!samples) return <HuginnMediaSlider {...props} />;

   const width = samples.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
   const currentWidth = (width * props.currentPercent) / 100;
   const bufferedWidth = (width * (props.bufferedPercent ?? 0)) / 100;

   return (
      <BaseSlider.Root
         value={props.currentPercent}
         orientation="horizontal"
         onValueChange={props.onChange}
         className="relative h-6 w-full touch-none select-none"
         thumbAlignment="edge-client-only"
         data-ignore-swipe
      >
         <BaseSlider.Control className="h-full w-full cursor-pointer">
            <BaseSlider.Track className="relative block h-full w-full">
               <svg aria-hidden viewBox={`0 0 ${width} ${WAVEFORM_HEIGHT}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  <defs>
                     <g id={`${clipId}-bars`}>
                        <WaveformBars samples={samples} />
                     </g>
                     <clipPath id={`${clipId}-buffered`}>
                        <rect width={bufferedWidth} height={WAVEFORM_HEIGHT} />
                     </clipPath>
                     <clipPath id={`${clipId}-current`}>
                        <rect width={currentWidth} height={WAVEFORM_HEIGHT} />
                     </clipPath>
                  </defs>
                  <use href={`#${clipId}-bars`} className="fill-white/15" />
                  <use href={`#${clipId}-bars`} className="fill-white/30" clipPath={`url(#${clipId}-buffered)`} />
                  <use href={`#${clipId}-bars`} className="fill-primary-500" clipPath={`url(#${clipId}-current)`} />
               </svg>
               <BaseSlider.Thumb aria-label="Voice message playback position" className="sr-only" />
            </BaseSlider.Track>
         </BaseSlider.Control>
      </BaseSlider.Root>
   );
}
