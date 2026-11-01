import { BackHandlerId, useBackHandler } from "@hooks/useBackHandler";
import { useFullscreen } from "@hooks/useFullscreen";
import { useIsMobile } from "@hooks/useIsMobile";
import { useTimeout } from "@hooks/useTimeout";
import { formatSeconds } from "@huginnjs/shared";
import clsx from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { useStorage, useStorageStore } from "@/stores/storageStore";

import HuginnMediaSlider from "./HuginnMediaSlider";
import LoadingBackground from "./LoadingBackground";
import VolumeSlider from "./VolumeSlider";

const VIDEO_TIMESTAMP_REQUIRED_WIDTH = 500;
const MOBILE_CONTROLS_HIDE_DELAY = 3000;

export default function VideoPlayer(props: {
   url: string;
   width: number;
   height: number;
   duration?: number;
   onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void;
}) {
   const containerRef = useRef<HTMLDivElement>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const [isPlaying, setPlaying] = useState(false);
   const isMobile = useIsMobile();

   const [currentVideoPercent, setCurrentVideoPercent] = useState(0);
   const [bufferedPercent, setBufferedPercent] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   const [videoDuration, setVideoDuration] = useState(0);
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const [areControlsVisible, setControlsVisible] = useState(true);
   const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
   const isMobileFullscreen = isMobile && isFullscreen;
   const { start: startControlsTimeout, cancel: cancelControlsTimeout } = useTimeout(() => setControlsVisible(false), MOBILE_CONTROLS_HIDE_DELAY);
   const settings = useStorage("settings");
   const { updateSettings } = useStorageStore();
   const aspectRatio = props.width && props.height ? props.width / props.height : 1;

   useBackHandler(BackHandlerId.VideoPlayer, () => {
      if (isFullscreen) {
         void toggleFullscreen();
         return true;
      }
      return false;
   });

   useEffect(() => {
      setControlsVisible(true);
   }, [isMobileFullscreen]);

   useEffect(() => {
      if (isMobileFullscreen && areControlsVisible && isPlaying && isLoaded && !hasError) {
         startControlsTimeout();
      }

      return cancelControlsTimeout;
   }, [isMobileFullscreen, areControlsVisible, isPlaying, isLoaded, hasError, startControlsTimeout, cancelControlsTimeout]);

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
            setControlsVisible(true);
         },
         { signal: controller.signal },
      );

      videoRef.current?.addEventListener(
         "timeupdate",
         () => {
            const current = videoRef.current?.currentTime ?? 0;
            const duration = videoRef.current?.duration ?? 0;
            setCurrentTime(current);

            const percentage = Number.isFinite(duration) && duration > 0 ? (current / duration) * 100 : 0;
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

               if (Number.isFinite(duration) && duration > 0) {
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

   function updateVideoDuration() {
      const duration = videoRef.current?.duration ?? 0;
      setVideoDuration(Number.isFinite(duration) && duration > 0 ? duration : 0);
   }

   function updateCurrentVideoPercent(percent: number) {
      if (videoRef.current) {
         const duration = videoRef.current?.duration ?? 0;
         if (!Number.isFinite(duration) || duration <= 0) return;

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

   function togglePlaying() {
      if (isPlaying) {
         videoRef.current?.pause();
      } else {
         videoRef.current?.play();
      }
   }

   function restartControlsTimeout() {
      if (isMobileFullscreen && areControlsVisible && isPlaying) {
         startControlsTimeout();
      }
   }

   async function handleMobileClick() {
      if (!isFullscreen) {
         await toggleFullscreen();
         videoRef.current?.play();
      } else {
         setControlsVisible((visible) => !visible);
      }
   }

   return (
      <div
         ref={containerRef}
         className={clsx("group/video relative flex w-full overflow-hidden rounded-md")}
         style={isFullscreen ? undefined : { width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}
         onClick={isMobile ? handleMobileClick : togglePlaying}
      >
         <video
            width={isFullscreen ? undefined : props.width}
            height={isFullscreen ? undefined : props.height}
            className="h-full w-full"
            src={props.url}
            ref={videoRef}
            playsInline
            onContextMenu={isFullscreen && isMobile ? undefined : props.onContextMenu}
            onLoadedMetadata={updateVideoDuration}
            onDurationChange={updateVideoDuration}
            onEmptied={() => setVideoDuration(0)}
            onLoadedData={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            onEnded={() => {
               setPlaying(false);
               setControlsVisible(true);
            }}
         />
         <LoadingBackground hasError={hasError} isLoaded={isLoaded} />
         {isLoaded && !hasError && isMobileFullscreen && areControlsVisible && (
            <button
               type="button"
               aria-label={isPlaying ? "Pause" : "Play"}
               className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white"
               onClick={(event) => {
                  event.stopPropagation();
                  togglePlaying();
               }}
            >
               {isPlaying ? <IconMingcutePauseFill className="size-10" /> : <IconMingcutePlayFill className="size-10" />}
            </button>
         )}
         {isLoaded && !hasError && (!isMobileFullscreen || areControlsVisible) && (
            <div
               onClick={(event) => {
                  event.stopPropagation();
                  restartControlsTimeout();
               }}
               onPointerDownCapture={cancelControlsTimeout}
               onPointerUpCapture={restartControlsTimeout}
               onPointerCancelCapture={restartControlsTimeout}
               data-ignore-swipe
               data-ignore-reply
               className={clsx(
                  "bg-surface-alt/90 absolute inset-x-0 bottom-0 flex items-center gap-x-2 px-2 py-2 transition-[translate]",
                  isMobile && isFullscreen && "pb-7",
                  isPlaying && !isMobile && "translate-y-full group-hover/video:translate-y-0",
               )}
            >
               {!isMobileFullscreen && (
                  <button
                     type="button"
                     aria-label={isPlaying ? "Pause" : "Play"}
                     onClick={togglePlaying}
                     className="shrink-0 cursor-pointer text-white/80 hover:text-white"
                  >
                     {isPlaying ? <IconMingcutePauseFill className="size-6" /> : <IconMingcutePlayFill className="size-6" />}
                  </button>
               )}
               {(isFullscreen || props.width >= VIDEO_TIMESTAMP_REQUIRED_WIDTH) && (
                  <div className="font-ubuntu flex shrink-0 gap-x-1 text-sm">
                     <span>{formatSeconds(currentTime)}</span>
                     <span>/</span>
                     <span>{formatSeconds(props.duration ?? videoDuration)}</span>
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
