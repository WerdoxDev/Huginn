import { useAudioCoverImage } from "@hooks/useAudioMetadata";
import { useOpen } from "@hooks/useOpen";
import { formatSeconds } from "@huginnjs/shared";
import { clsx } from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { useStorage, useStorageStore } from "@/stores/storageStore";

import HuginnMediaSlider from "./HuginnMediaSlider";
import LoadingBackground from "./LoadingBackground";
import VolumeSlider from "./VolumeSlider";

export default function AudioPlayer(props: { url: string; filename: string; onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void }) {
   const audioRef = useRef<HTMLAudioElement>(null);
   const [playing, setPlaying] = useState(false);
   const [currentPercent, setCurrentPercent] = useState(0);
   const [bufferedPercent, setBufferedPercent] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   const [duration, setDuration] = useState(0);
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const { openUrl } = useOpen();
   const settings = useStorage("settings");
   const { updateSettings } = useStorageStore();
   const coverImage = useAudioCoverImage(audioRef);

   useEffect(() => {
      if (audioRef.current) {
         audioRef.current.volume = settings.mediaVolume / 100;
      }
   }, [settings.mediaVolume]);

   useEffect(() => {
      const audio = audioRef.current;
      const controller = new AbortController();

      audio?.addEventListener("play", () => setPlaying(true), { signal: controller.signal });
      audio?.addEventListener("pause", () => setPlaying(false), { signal: controller.signal });
      audio?.addEventListener(
         "loadedmetadata",
         () => {
            setDuration(audio.duration);
         },
         { signal: controller.signal },
      );
      audio?.addEventListener(
         "timeupdate",
         () => {
            setCurrentTime(audio.currentTime);
            setCurrentPercent(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
         },
         { signal: controller.signal },
      );
      audio?.addEventListener(
         "progress",
         () => {
            if (audio.buffered.length > 0 && audio.duration > 0) {
               setBufferedPercent((audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100);
            }
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, []);

   function updateCurrentPercent(percent: number) {
      const audio = audioRef.current;

      if (audio) {
         const time = (audio.duration / 100) * percent;
         audio.currentTime = time;
         setCurrentTime(time);
      }
   }

   function updateVolumePercent(percent: number) {
      if (audioRef.current) {
         audioRef.current.volume = percent / 100;
      }
      void updateSettings({ mediaVolume: percent });
   }

   function togglePlaying(e: MouseEvent) {
      e.stopPropagation();

      if (playing) {
         audioRef.current?.pause();
      } else {
         void audioRef.current?.play();
      }
   }

   return (
      <div className="bg-surface-alt flex w-[min(24rem,100%)] items-center gap-x-3 rounded-md px-3 py-3" onContextMenu={props.onContextMenu}>
         <button
            className="bg-primary-500 relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md p-2 text-white/80 hover:text-white"
            onClick={togglePlaying}
         >
            {coverImage && <img src={coverImage} className="absolute inset-0" />}
            <div className={clsx("absolute inset-0 z-10 flex items-center justify-center", coverImage && "bg-black/20")}>
               {playing ? <IconMingcutePauseFill className="size-8" /> : <IconMingcutePlayFill className="size-8" />}
            </div>
         </button>
         {/* <button type="button" onClick={togglePlaying} className="bg-primary-500 h-max shrink-0 cursor-pointer text-white/80 hover:text-white">
         </button> */}
         <div className="flex min-w-0 flex-1 flex-col justify-center gap-y-0.5">
            <button
               type="button"
               className="text-primary-500 cursor-pointer overflow-hidden text-left text-sm text-nowrap text-ellipsis hover:underline"
               onClick={() => openUrl(props.url)}
            >
               {props.filename}
            </button>
            {/* <div className="truncate text-sm" title={props.filename}>
               {props.filename}
            </div> */}
            <div className="relative flex items-center gap-x-2">
               <audio
                  src={props.url}
                  ref={audioRef}
                  preload="metadata"
                  onLoadedMetadata={() => setIsLoaded(true)}
                  onError={() => setHasError(true)}
               />
               <LoadingBackground hasError={hasError} isLoaded={isLoaded} />
               {isLoaded && !hasError && (
                  <>
                     <div className="font-ubuntu flex shrink-0 gap-x-1 text-sm">
                        <span>{formatSeconds(currentTime)}</span>
                        <span>/</span>
                        <span>{formatSeconds(duration)}</span>
                     </div>
                     <HuginnMediaSlider
                        orientation="horizontal"
                        currentPercent={currentPercent}
                        bufferedPercent={bufferedPercent}
                        onChange={updateCurrentPercent}
                     />
                     <VolumeSlider currentPercent={settings.mediaVolume} onChange={updateVolumePercent} />
                  </>
               )}
            </div>
         </div>
         {/* <Tooltip>
            <Tooltip.Trigger className="mx-2" onClick={() => openUrl(props.url)}>
               <IconMingcuteDownload2Fill className="size-6 text-white/50 transition-colors duration-100 hover:text-white" />
            </Tooltip.Trigger>
            <Tooltip.Content>Download</Tooltip.Content>
         </Tooltip> */}
      </div>
   );
}
