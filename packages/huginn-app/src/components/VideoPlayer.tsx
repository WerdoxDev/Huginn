import type { MediaViewerPreview as Preview } from "@lib/media-viewer-source";

import { BackHandlerId, useBackHandler } from "@hooks/useBackHandler";
import { useFullscreen } from "@hooks/useFullscreen";
import { useIsMobile } from "@hooks/useIsMobile";
import { useTimeout } from "@hooks/useTimeout";
import { formatSeconds } from "@huginnjs/shared";
import clsx from "clsx";
import { type CSSProperties, type MouseEvent, useEffect, useRef, useState, type RefObject } from "react";

import { useStorage, useStorageStore } from "@/stores/storageStore";

import HuginnMediaSlider from "./HuginnMediaSlider";
import LoadingBackground from "./LoadingBackground";
import MediaViewerPreview from "./MediaViewerPreview";
import VolumeSlider from "./VolumeSlider";

const VIDEO_TIMESTAMP_REQUIRED_WIDTH = 500;
const MOBILE_CONTROLS_HIDE_DELAY = 3000;

export default function VideoPlayer(props: {
   url: string;
   width: number;
   height: number;
   duration?: number;
   active: boolean;
   pictureStyle?: CSSProperties;
   transitionRef?: RefObject<HTMLDivElement | null>;
   preview?: Preview;
   onLoadedData?: () => void;
   onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void;
}) {
   const containerRef = useRef<HTMLDivElement>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const [isPlaying, setPlaying] = useState(false);
   const [hasEnded, setHasEnded] = useState(false);
   const isMobile = useIsMobile();

   const [currentVideoPercent, setCurrentVideoPercent] = useState(0);
   const [bufferedPercent, setBufferedPercent] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   const [videoDuration, setVideoDuration] = useState(0);
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const [areControlsVisible, setControlsVisible] = useState(true);
   const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
   const { start: startControlsTimeout, cancel: cancelControlsTimeout } = useTimeout(() => setControlsVisible(false), MOBILE_CONTROLS_HIDE_DELAY);
   const settings = useStorage("settings");
   const { updateSettings } = useStorageStore();

   useBackHandler(
      BackHandlerId.VideoPlayer,
      () => {
         if (isFullscreen) {
            void toggleFullscreen();
            return true;
         }
         return false;
      },
      "before-stack",
   );

   useEffect(() => {
      setControlsVisible(true);
   }, [isMobile, isFullscreen]);

   useEffect(() => {
      if (isMobile && areControlsVisible && isPlaying && isLoaded && !hasError) {
         startControlsTimeout();
      }

      return cancelControlsTimeout;
   }, [isMobile, areControlsVisible, isPlaying, isLoaded, hasError, startControlsTimeout, cancelControlsTimeout]);

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
            setHasEnded(false);
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

   useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      video.src = props.url;
      video.currentTime = 0;
      return () => {
         video.pause();
         video.removeAttribute("src");
         video.load();
      };
   }, [props.url]);

   useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (props.active) void video.play().catch(() => {});
      else video.pause();
   }, [props.active, props.url]);

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
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
         videoRef.current.pause();
      } else {
         if (hasEnded && videoRef.current) videoRef.current.currentTime = 0;
         void videoRef.current?.play().catch(() => {});
      }
   }

   function restartControlsTimeout() {
      if (isMobile && areControlsVisible && isPlaying) {
         startControlsTimeout();
      }
   }

   return (
      <div
         ref={containerRef}
         className={clsx("group/video relative flex w-full", !isFullscreen && "rounded-lg")}
         style={isFullscreen ? undefined : { width: props.width, height: props.height }}
         onClick={(event) => {
            event.stopPropagation();
            if (isMobile) setControlsVisible((visible) => !visible);
            else togglePlaying();
         }}
      >
         <div data-media-transition ref={props.transitionRef} className="relative h-full w-full">
            <div className="relative h-full w-full" data-media-picture style={isFullscreen ? undefined : props.pictureStyle}>
               <video
                  width={isFullscreen ? undefined : props.width}
                  height={isFullscreen ? undefined : props.height}
                  className="h-full w-full rounded-lg object-contain"
                  style={{ visibility: !isLoaded && props.preview ? "hidden" : undefined }}
                  src={props.url}
                  ref={videoRef}
                  playsInline
                  draggable={false}
                  onContextMenu={isFullscreen && isMobile ? undefined : props.onContextMenu}
                  onLoadedMetadata={updateVideoDuration}
                  onDurationChange={updateVideoDuration}
                  onEmptied={() => setVideoDuration(0)}
                  onLoadedData={() => {
                     requestAnimationFrame(() => {
                        setIsLoaded(true);
                        props.onLoadedData?.();
                     });
                  }}
                  onError={() => setHasError(true)}
                  onEnded={() => {
                     setPlaying(false);
                     setHasEnded(true);
                     setControlsVisible(true);
                  }}
               />
               {!isLoaded && props.preview && <MediaViewerPreview preview={props.preview} />}
               {(!props.preview || hasError) && <LoadingBackground hasError={hasError} isLoaded={isLoaded} />}
            </div>
         </div>
         {isLoaded && !hasError && isMobile && areControlsVisible && (
            <button
               type="button"
               data-media-controls
               title={isPlaying ? "Pause" : hasEnded ? "Replay" : "Play"}
               className="absolute top-1/2 left-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-(--media-viewer-controls-opacity)"
               onClick={(event) => {
                  event.stopPropagation();
                  togglePlaying();
               }}
            >
               {isPlaying ? <IconMingcutePauseFill className="size-10" /> : <IconMingcutePlayFill className="size-10" />}
            </button>
         )}
         {isLoaded && !hasError && (
            <div
               className={clsx(
                  "pointer-events-none fixed inset-0 flex items-end justify-center rounded-md opacity-(--media-viewer-controls-opacity)",
                  isFullscreen ? "overflow-hidden" : "px-4",
               )}
            >
               <div
                  onClick={(event) => {
                     event.stopPropagation();
                     restartControlsTimeout();
                  }}
                  onPointerDownCapture={cancelControlsTimeout}
                  onPointerUpCapture={restartControlsTimeout}
                  onPointerCancelCapture={restartControlsTimeout}
                  data-media-controls
                  data-ignore-swipe
                  data-ignore-reply
                  className={clsx(
                     "bg-surface-alt/90 pointer-events-auto z-10 w-full items-center gap-x-2 px-2 py-2 transition-[translate]",
                     isMobile && !areControlsVisible ? "hidden" : "flex",
                     isMobile && isFullscreen && "pb-7",
                     isFullscreen ? "" : "max-w-2xl rounded-md portrait:mb-10 landscape:mb-1 lg:landscape:mb-10",
                     isFullscreen && isPlaying && !isMobile && "translate-y-full group-hover/video:translate-y-0",
                  )}
               >
                  {!isMobile && (
                     <button
                        type="button"
                        title={isPlaying ? "Pause" : hasEnded ? "Replay" : "Play"}
                        onClick={togglePlaying}
                        className="shrink-0 cursor-pointer text-white/80 hover:text-white"
                     >
                        {isPlaying ? <IconMingcutePauseFill className="size-6" /> : <IconMingcutePlayFill className="size-6" />}
                     </button>
                  )}
                  {(isFullscreen || window.innerWidth >= VIDEO_TIMESTAMP_REQUIRED_WIDTH) && (
                     <div className="font-ubuntu flex shrink-0 gap-x-1 text-sm text-white">
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
                  <button
                     type="button"
                     title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                     className="shrink-0 cursor-pointer text-white/80 hover:text-white"
                     onClick={toggleFullscreen}
                  >
                     {isFullscreen ? <IconMingcuteFullscreenExitFill className="size-6" /> : <IconMingcuteFullscreenFill className="size-6" />}
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
