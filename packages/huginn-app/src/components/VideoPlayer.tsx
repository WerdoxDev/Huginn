import { Transition } from "@headlessui/react";
import { useFullscreen } from "@hooks/useFullscreen";
import { useProgressBar } from "@hooks/useProgressBar";
import { formatSeconds } from "@huginn/shared";
import clsx from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";
import Slider from "./Slider";
import VolumeSlider from "./VolumeSlider";

const VIDEO_TIMESTAMP_REQUIRED_WIDTH = 500;

export default function VideoPlayer(props: { url: string; width: number; height: number }) {
   const containerRef = useRef<HTMLDivElement>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const [playing, setPlaying] = useState(false);

   const [currentVideoPercent, setCurrentVideoPercent] = useState(0);
   const [currentAudioPercent, setCurrentAudioPercent] = useState(0);
   const [bufferedPercent, setBufferedPercent] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   // const [bufferedTime, setBufferedTime] = useState(0);
   // const videoProgress = useProgressBar({ startOffset: 2, endOffset: 0, mouseOffset: 5 });
   // const audioProgress = useProgressBar({ startOffset: 10, endOffset: 0, mouseOffset: 5, defaultValue: 100 });
   const [videoDuration, setVideoDuration] = useState(0);
   // const [videoTime, setVideoTime] = useState(0);
   const [loaded, setLoaded] = useState(false);
   const [errored, setErrored] = useState(false);
   const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

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
      setCurrentAudioPercent(percent);
      if (videoRef.current) {
         videoRef.current.volume = percent / 100;
      }
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
         style={{ width: `${props.width}px`, height: `${props.height}px` }}
         className={clsx("group/video relative flex overflow-hidden rounded-md")}
         onClick={togglePlaying}
      >
         <video
            width={isFullscreen ? undefined : props.width}
            height={isFullscreen ? undefined : props.height}
            style={isFullscreen ? undefined : { width: `${props.width}px`, height: `${props.height}px` }}
            src={props.url}
            ref={videoRef}
            onLoadedData={() => setLoaded(true)}
            onError={() => setErrored(true)}
         />
         <Transition show={!loaded || errored}>
            <div
               className={clsx(!errored && "absolute inset-0", "bg-surface/40 data-closed:opacity-0 flex items-center justify-center duration-200")}
               style={{ width: `${props.width}px`, height: `${props.height}px` }}
            >
               {!loaded && !errored && <LoadingIcon className="size-16" />}
               {errored && <IconMingcuteWarningFill className="text-negative-100 size-16" />}
            </div>
         </Transition>
         <div
            onClick={(e) => e.stopPropagation()}
            className={clsx(
               "bg-surface-deep/90 absolute inset-x-0 bottom-0 flex items-center gap-x-4 px-2 py-2 transition-[translate]",
               playing && "translate-y-full group-hover/video:translate-y-0",
            )}
         >
            <button type="button" onClick={togglePlaying} className="shrink-0 cursor-pointer text-white/80 hover:text-white">
               {playing ? <IconMingcutePauseFill className="size-6" /> : <IconMingcutePlayFill className="size-6" />}
            </button>
            {(isFullscreen || props.width >= VIDEO_TIMESTAMP_REQUIRED_WIDTH) && (
               <div className="shrink-0 text-sm">
                  {formatSeconds(currentTime)} / {formatSeconds(videoDuration)}
               </div>
            )}
            <Slider
               orientation="horizontal"
               currentPercent={currentVideoPercent}
               bufferedPercent={bufferedPercent}
               onChange={updateCurrentVideoPercent}
            />
            <VolumeSlider currentPercent={currentAudioPercent} onChange={updateCurrentAudioPercent} />
            <button type="button" className="shrink-0 cursor-pointer text-white/80 hover:text-white" onClick={toggleFullscreen}>
               {isFullscreen ? <IconMingcuteFullscreenExitFill className="size-6" /> : <IconMingcuteFullscreenFill className="size-6" />}
            </button>
         </div>
      </div>
   );
}
