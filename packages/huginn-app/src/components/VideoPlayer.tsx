import { useFullscreen } from "@hooks/useFullscreen";
import { formatSeconds } from "@huginn/shared";
import clsx from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { useStorage, useStorageStore } from "@/stores/storageStore";

import HuginnMediaSlider from "./HuginnMediaSlider";
import LoadingBackground from "./LoadingBackground";
import VolumeSlider from "./VolumeSlider";

const VIDEO_TIMESTAMP_REQUIRED_WIDTH = 500;

export default function VideoPlayer(props: {
   url: string;
   width: number;
   height: number;
   onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void;
}) {
   const containerRef = useRef<HTMLDivElement>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const [playing, setPlaying] = useState(false);

   const [currentVideoPercent, setCurrentVideoPercent] = useState(0);
   const [bufferedPercent, setBufferedPercent] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   const [videoDuration, setVideoDuration] = useState(0);
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
   const settings = useStorage("settings");
   const { updateSettings } = useStorageStore();
   const aspectRatio = props.width && props.height ? props.width / props.height : 1;

   useEffect(() => {
      if (videoRef.current) {
         videoRef.current.volume = settings.mediaVolume / 100;
      }
   }, [settings.mediaVolume]);

   useEffect(() => {
      const controller = new AbortController();

      videoRef.current?.addEventListener(
         "play",
         () => {
            setPlaying(true);
         },
         { signal: controller.signal },
      );

      videoRef.current?.addEventListener(
         "pause",
         () => {
            setPlaying(false);
         },
         { signal: controller.signal },
      );

      videoRef.current?.addEventListener("loadedmetadata", () => {
         setVideoDuration(videoRef.current?.duration ?? 0);
      });

      videoRef.current?.addEventListener(
         "timeupdate",
         () => {
            const current = videoRef.current?.currentTime ?? 0;
            const duration = videoRef.current?.duration ?? 0;
            setCurrentTime(current);

            const percentage = (current / duration) * 100;
            setCurrentVideoPercent(percentage);
         },
         { signal: controller.signal },
      );

      videoRef.current?.addEventListener(
         "progress",
         () => {
            const buffered = videoRef.current?.buffered;

            if (buffered && buffered.length > 0) {
               const end = buffered.end(buffered.length - 1); // Get the end time of the first (and typically only) buffered range
               const duration = videoRef.current?.duration ?? 0;

               if (duration > 0) {
                  const percentage = (end / duration) * 100;
                  setBufferedPercent(percentage);
               }
            }
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort();
      };
   }, []);

   function updateCurrentVideoPercent(percent: number) {
      if (videoRef.current) {
         const duration = videoRef.current?.duration ?? 0;
         const time = (duration / 100) * percent;
         videoRef.current.currentTime = time;
         setCurrentTime(time);
      }
   }

   function updateCurrentAudioPercent(percent: number) {
      if (videoRef.current) {
         videoRef.current.volume = percent / 100;
      }
      void updateSettings({ mediaVolume: percent });
   }

   function togglePlaying(e: MouseEvent) {
      if (playing) {
         videoRef.current?.pause();
      } else {
         videoRef.current?.play();
      }
   }

   return (
      <div
         ref={containerRef}
         className={clsx("group/video relative flex w-full overflow-hidden rounded-md")}
         style={isFullscreen ? undefined : { width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}
         onClick={togglePlaying}
      >
         <video
            width={isFullscreen ? undefined : props.width}
            height={isFullscreen ? undefined : props.height}
            className="h-full w-full"
            src={props.url}
            ref={videoRef}
            onContextMenu={props.onContextMenu}
            onLoadedData={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
         />
         <LoadingBackground hasError={hasError} isLoaded={isLoaded} />
         {isLoaded && !hasError && (
            <div
               onClick={(e) => e.stopPropagation()}
               className={clsx(
                  "bg-surface-alt/90 absolute inset-x-0 bottom-0 flex items-center gap-x-2 px-2 py-2 transition-[translate]",
                  playing && "translate-y-full group-hover/video:translate-y-0",
               )}
            >
               <button type="button" onClick={togglePlaying} className="mr-2 shrink-0 cursor-pointer text-white/80 hover:text-white">
                  {playing ? <IconMingcutePauseFill className="size-6" /> : <IconMingcutePlayFill className="size-6" />}
               </button>
               {(isFullscreen || props.width >= VIDEO_TIMESTAMP_REQUIRED_WIDTH) && (
                  <div className="font-ubuntu flex shrink-0 gap-x-1 text-sm">
                     <span>{formatSeconds(currentTime)}</span>
                     <span>/</span>
                     <span>{formatSeconds(videoDuration)}</span>
                  </div>
               )}
               <HuginnMediaSlider
                  orientation="horizontal"
                  currentPercent={currentVideoPercent}
                  bufferedPercent={bufferedPercent}
                  onChange={updateCurrentVideoPercent}
               />
               <VolumeSlider currentPercent={settings.mediaVolume} onChange={updateCurrentAudioPercent} />
               <button type="button" className="shrink-0 cursor-pointer text-white/80 hover:text-white" onClick={toggleFullscreen}>
                  {isFullscreen ? <IconMingcuteFullscreenExitFill className="size-6" /> : <IconMingcuteFullscreenFill className="size-6" />}
               </button>
            </div>
         )}
      </div>
   );
}
