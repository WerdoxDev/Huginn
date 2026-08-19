import type { Snowflake, Unpacked } from "@huginnjs/shared";

import HuginnButton from "@components/button/HuginnButton";
import LoadingIcon from "@components/LoadingIcon";
import AndroidAudioRouteSelect from "@components/voice/AndroidAudioRouteSelect";
import AndroidCameraFlipButton from "@components/voice/AndroidCameraFlipButton";
import VoiceElement from "@components/voice/VoiceElement";
import VoicePopoutIndicator from "@components/voice/VoicePopoutIndicator";
import VoicePopoutStatus from "@components/voice/VoicePopoutStatus";
import VoiceControls from "@components/VoiceControls";
import { Transition } from "@headlessui/react";
import { BackHandlerId, useBackHandler } from "@hooks/useBackHandler";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHover } from "@hooks/useHover";
import { useIsMobile } from "@hooks/useIsMobile";
import { useLookup } from "@hooks/useLookup";
import { useVoicePreferences } from "@hooks/useVoicePreferences";
import { useVoiceSnapshot } from "@hooks/voice/useMediaSources";
import { isChildWindow } from "@lib/child-window";
import { createRadialMaskStyle } from "@lib/mask-utils";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore, voiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import type { MediaSource } from "@/types";

const minHeight = 250;
const maxHeightPercentage = 60;
const isMainWindow = window.opener === null;

export default function DirectChannelCall(props: { channelId: Snowflake }) {
   const { voiceState, voiceStates, callStates, speakingStates } = useVoiceStore();

   const { user } = useThisUser();
   const { mediaSources, popoutState } = useVoiceSnapshot();
   const { voicePreferences } = useVoicePreferences();
   const isMobile = useIsMobile();

   const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId]);
   const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);
   const isGridView = useMemo(() => thisVoiceStates.some((x) => x.isAudioStreaming || x.isScreenSharing || x.isCameraOn), [thisVoiceStates]);

   const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);
   const voicePreferencesLookup = useLookup(voicePreferences, (pref) => pref.userId);

   const { cameraSources, microphoneSources, streamAudioSources, streamVideoSources } = useMemo(() => {
      const streamVideoSources: Record<Snowflake, MediaSource> = {};
      const streamAudioSources: Record<Snowflake, MediaSource> = {};
      const microphoneSources: Record<Snowflake, MediaSource> = {};
      const cameraSources: Record<Snowflake, MediaSource> = {};

      for (const mediaSource of mediaSources) {
         if (mediaSource.kind === "camera") cameraSources[mediaSource.userId] = mediaSource;
         if (mediaSource.kind === "microphone") microphoneSources[mediaSource.userId] = mediaSource;
         if (mediaSource.kind === "stream_audio") streamAudioSources[mediaSource.userId] = mediaSource;
         if (mediaSource.kind === "stream_video") streamVideoSources[mediaSource.userId] = mediaSource;
      }

      return { streamVideoSources, streamAudioSources, microphoneSources, cameraSources };
   }, [mediaSources]);

   const isShown = useMemo(() => thisVoiceStates.length !== 0, [thisVoiceStates]);
   const isLoading = useMemo(() => !thisCallState, [thisCallState]);

   const [containerRef, showControls] = useHover<HTMLDivElement>([user, isShown]);
   const gridRef = useRef<HTMLDivElement>(null);
   const resizerRef = useRef<HTMLDivElement>(null);
   const [isResizing, setIsResizing] = useState(false);
   const [gridSize, setGridSize] = useState<{
      elementWidth: number;
      elementHeight: number;
      rows: number;
      cols: number;
   }>();
   const [gridHeight, setGridHeight] = useState(250);
   const [isMobileCallHidden, setIsMobileCallHidden] = useState(true);
   const [isMobileControlsHidden, setIsMobileControlHidden] = useState(true);
   const { isFullscreen: actualIsFullScreen, toggleFullscreen } = useFullscreen();
   const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof mediaSources> | undefined>(undefined);
   const isFullscreen = actualIsFullScreen || !isMainWindow;
   const isOverlay = isFullscreen || isMobile;

   useEffect(() => {
      if (maximizedSource && !mediaSources.some((x) => x.producerId === maximizedSource.producerId)) {
         setMaximizedSource(undefined);
      }
   }, [mediaSources]);

   useEffect(() => {
      if (!voiceState.channelId) {
         setMaximizedSource(undefined);
         setIsMobileCallHidden(true);
      } else if (voiceState.channelId === props.channelId) {
         setIsMobileCallHidden(false);
      }
   }, [voiceState]);

   useEffect(() => {
      setMaximizedSource(undefined);
      setIsMobileCallHidden(true);
   }, [props.channelId]);

   useEffect(() => {
      if (!isMobileCallHidden) {
         setIsMobileControlHidden(false);
      }
   }, [isMobileCallHidden]);

   useBackHandler(BackHandlerId.CallOverlay, () => {
      if (!isMobileCallHidden) {
         setIsMobileCallHidden(true);
         return true;
      }
   });

   useLayoutEffect(() => {
      const controller = new AbortController();

      window.addEventListener(
         "resize",
         () => {
            if (!gridRef.current) {
               return;
            }

            updateGridSize();

            // When we exit fullscreen, the element is still here.
            // Which we can use to detect we are exiting fullscreen and should not fiddle with the height
            if (document.fullscreenElement) {
               return;
            }

            const maxHeight = (window.innerHeight / 100) * maxHeightPercentage;
            if (gridRef.current.clientHeight > maxHeight) {
               setGridHeight(maxHeight);
            }
         },
         { signal: controller.signal },
      );

      document.addEventListener(
         "fullscreenchange",
         () => {
            updateGridSize();
         },
         { signal: controller.signal },
      );

      resizerRef.current?.addEventListener(
         "mousedown",
         () => {
            setIsResizing(true);
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort();
      };
   }, [isShown, maximizedSource, isMobileCallHidden]);

   useEffect(() => {
      if (maximizedSource && !mediaSources.some((source) => source.producerId === maximizedSource.producerId)) {
         setMaximizedSource(undefined);
      }

      if (popoutState.openMediaPopoutProducers.includes(maximizedSource?.producerId ?? "")) {
         setMaximizedSource(undefined);
      }
   }, [maximizedSource, mediaSources, popoutState]);

   useLayoutEffect(() => {
      updateGridSize();
   }, [mediaSources, gridHeight, thisCallState, maximizedSource, isOverlay, thisVoiceStates, isGridView, popoutState, isMobileCallHidden]);

   useEffect(() => {
      const controller = new AbortController();
      if (isResizing) {
         document.addEventListener("mousemove", resize, {
            signal: controller.signal,
         });
         document.addEventListener("mouseup", stopResize, {
            signal: controller.signal,
         });
      }

      return () => {
         controller.abort();
      };
   }, [isResizing]);

   function resize(e: globalThis.MouseEvent) {
      if (!gridRef.current || !isResizing) {
         return;
      }

      const maxHeight = (window.innerHeight / 100) * maxHeightPercentage;

      const rect = gridRef.current.getBoundingClientRect();
      const newHeight = Math.min(Math.max(e.clientY - rect.top + 2, minHeight), maxHeight);
      setGridHeight(newHeight);
   }

   function stopResize() {
      setIsResizing(false);
   }

   function maximizeSource(producerId: string) {
      const foundSource = mediaSources.find(
         (x) => x.producerId === producerId && (x.kind === "stream_video" || x.kind === "camera" || x.kind === "stream_audio"),
      );

      if (!foundSource) {
         return;
      }

      if (maximizedSource) {
         setMaximizedSource(undefined);
      } else {
         if (foundSource) {
            setMaximizedSource(foundSource);
         }
      }
   }

   function handleClick() {
      if (isMobile) {
         setIsMobileControlHidden((prev) => !prev);
      }
   }

   function handleHideCallClick(e: MouseEvent) {
      setIsMobileCallHidden(true);
      e.stopPropagation();
   }

   const updateGridSize = useEffectEvent(() => {
      if (!gridRef.current) {
         return;
      }

      const store = voiceStore.getState();
      const openMediaPopoutProducers = popoutState.openMediaPopoutProducers;
      const numBoxes = maximizedSource?.producerId
         ? 1
         : // People in voice
           store.voiceStates.filter((x) => !openMediaPopoutProducers.includes(cameraSources[x.userId]?.producerId ?? "")).length +
           // Streams
           store.voiceStates.filter(
              (x) =>
                 (x.isAudioStreaming || x.isScreenSharing) &&
                 !openMediaPopoutProducers.includes((streamVideoSources[x.userId] || streamAudioSources[x.userId])?.producerId ?? ""),
           ).length +
           // People getting ringed
           (thisCallState?.ringing.length ?? 0);

      const containerWidth = gridRef.current.clientWidth;
      const containerHeight = gridRef.current.clientHeight;
      const boxMargin = !maximizedSource?.producerId ? 12 : 0;
      const padding = {
         top: !maximizedSource?.producerId ? 12 : 0,
         right: !maximizedSource?.producerId ? 20 : 0,
         bottom: !maximizedSource?.producerId ? 80 : 0,
         left: !maximizedSource?.producerId ? 20 : 0,
      };
      const aspectRatio = 16 / 9;

      let best = {
         elementWidth: 0,
         elementHeight: 0,
         rows: 0,
         cols: 0,
      };

      for (let rows = 1; rows <= numBoxes; rows++) {
         const cols = Math.ceil(numBoxes / rows);

         // Total spacing from margins
         const totalMarginX = (cols - 1) * boxMargin;
         const totalMarginY = (rows - 1) * boxMargin;

         // Usable space after subtracting padding and internal margins
         const usableWidth = containerWidth - padding.left - padding.right - totalMarginX;
         const usableHeight = containerHeight - padding.top - padding.bottom - totalMarginY;

         // Max box size
         let elementWidth = usableWidth / cols;
         let elementHeight = elementWidth / aspectRatio;

         // If height overflows, resize based on height instead
         if (elementHeight > usableHeight / rows) {
            elementHeight = usableHeight / rows;
            elementWidth = elementHeight * aspectRatio;
         }

         if (elementWidth * elementHeight > best.elementWidth * best.elementHeight) {
            best = {
               elementWidth: Math.floor(elementWidth),
               elementHeight: Math.floor(elementHeight),
               rows,
               cols,
            };
         }
      }

      setGridSize(best);
   });

   if (!user || !isShown) {
      return;
   }

   const indicatorMask = createRadialMaskStyle([
      {
         radius: `0.75rem`,
         x: `calc(100% - 0.75rem + 2px)`,
         y: `calc(100% - 0.75rem + 2px)`,
      },
   ]);

   const mobileCallIndicator = (
      <div className={clsx("fixed top-20 right-4 z-20 transition-opacity", isMobileCallHidden ? "opacity-100" : "pointer-events-none opacity-0")}>
         <HuginnButton
            style={indicatorMask}
            color="primary"
            className="flex size-16 items-center justify-center rounded-full! text-white shadow-lg"
            onClick={() => setIsMobileCallHidden(false)}
         >
            <IconMingcutePhoneFill className="size-8" />
         </HuginnButton>
         <div className="bg-positive-500 absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full text-sm text-white">
            {thisVoiceStates.length}
         </div>
      </div>
   );

   const call = (
      <div
         className={clsx(
            "group/wrapper shadow-surface-void z-10 flex shrink-0 flex-col gap-y-3 shadow-2xl select-none",
            isOverlay ? "bg-surface-deep fixed inset-0 z-997 rounded-none" : "ring-primary-800 relative z-30 m-2 mb-0 rounded-xl bg-black/80 ring-2",
            isMobile && "transition-all duration-200 data-closed:translate-y-full data-closed:scale-90 data-closed:blur-xl",
         )}
         ref={containerRef}
         onClick={handleClick}
      >
         <div ref={resizerRef} className="absolute inset-x-0 -bottom-1.5 z-20 hidden h-3 cursor-ns-resize lg:block" />

         {isMobile && (
            <HuginnButton
               type="button"
               color="surface-alt"
               className="absolute top-3 left-3 z-40 flex size-10 items-center justify-center rounded-full! text-white/70 shadow-lg transition-colors active:text-white"
               onClick={handleHideCallClick}
            >
               <IconMingcuteDownFill className="size-6" />
            </HuginnButton>
         )}

         {isMobile && voiceState.channelId === props.channelId && (
            <div className="absolute top-3 right-3 z-40 flex gap-x-2" onClick={(event) => event.stopPropagation()}>
               {voiceState.isCameraOn && <AndroidCameraFlipButton cameraSource={cameraSources[user.id]} />}
               <AndroidAudioRouteSelect compact />
            </div>
         )}

         <VoicePopoutIndicator />
         {(isChildWindow() || isMobile) && <VoicePopoutStatus />}

         <div
            className={clsx(
               "flex w-full shrink flex-wrap content-center items-center justify-center gap-3",
               !maximizedSource && "px-5 py-2",
               !isLoading && !maximizedSource && "pb-20",
            )}
            ref={gridRef}
            style={{ height: !isOverlay ? gridHeight : "100%" }}
         >
            {popoutState.isPopoutOpen && !isChildWindow() ? (
               <div className="text-text flex items-center justify-center text-center">Voice is popped out in another window</div>
            ) : isLoading ? (
               <LoadingIcon className="size-16" />
            ) : (
               <>
                  {/* Consumable or consuming streams */}
                  {thisVoiceStates
                     .filter(
                        (x) =>
                           !popoutState.openMediaPopoutProducers.includes(
                              (streamVideoSources[x.userId] || streamAudioSources[x.userId])?.producerId ?? "",
                           ) &&
                           (x.isAudioStreaming || x.isScreenSharing) &&
                           (maximizedSource
                              ? x.userId === maximizedSource.userId &&
                                (maximizedSource.kind === "stream_video" || maximizedSource.kind === "stream_audio")
                              : true),
                     )
                     .map((x) => (
                        <VoiceElement
                           type="stream"
                           key={`${x.userId}-stream`}
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           gridElementHeight={gridSize?.elementHeight ?? 0}
                           userId={x.userId}
                           channelId={props.channelId}
                           guildId={null}
                           isConnected={voiceState.channelId === props.channelId}
                           isResizing={isResizing}
                           isGridView={isGridView}
                           isMaximized={!!maximizedSource}
                           mediaSource={streamVideoSources[x.userId] ?? streamAudioSources[x.userId]}
                           secondMediaSource={streamVideoSources[x.userId] && streamAudioSources[x.userId]}
                           voicePreference={voicePreferencesLookup[x.userId]}
                           voiceState={x}
                           onClick={voiceState.channelId === props.channelId ? maximizeSource : undefined}
                        />
                     ))}
                  {/* Normals user / cameras */}
                  {thisVoiceStates
                     .filter(
                        (x) =>
                           !popoutState.openMediaPopoutProducers.includes(cameraSources[x.userId]?.producerId ?? "") &&
                           (maximizedSource ? x.userId === maximizedSource.userId && maximizedSource.kind === "camera" : true),
                     )
                     .map((x) => (
                        <VoiceElement
                           type="normal"
                           key={`${x.userId}-element`}
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           gridElementHeight={gridSize?.elementHeight ?? 0}
                           mediaSource={cameraSources[x.userId] ?? microphoneSources[x.userId]}
                           secondMediaSource={cameraSources[x.userId] !== undefined ? microphoneSources[x.userId] : undefined}
                           voicePreference={voicePreferencesLookup[x.userId]}
                           userId={x.userId}
                           channelId={props.channelId}
                           guildId={null}
                           onClick={maximizeSource}
                           isResizing={isResizing}
                           isGridView={isGridView}
                           isSpeaking={usersSpeakingLookup[x.userId]?.speaking}
                           isMaximized={!!maximizedSource}
                           isConnected={voiceState.channelId === props.channelId}
                           voiceState={x}
                        />
                     ))}
                  {/* Ringing Users */}
                  {!maximizedSource &&
                     thisCallState?.ringing.map((x) => (
                        <VoiceElement
                           type="normal"
                           key={x}
                           isRinging
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           gridElementHeight={gridSize?.elementHeight ?? 0}
                           isGridView={isGridView}
                           userId={x}
                           channelId={props.channelId}
                           guildId={null}
                           isConnected={voiceState.channelId === props.channelId}
                           isResizing={isResizing}
                        />
                     ))}
               </>
            )}
         </div>
         {!isLoading && (
            <VoiceControls
               isMobile={isMobile}
               isMobileControlsHidden={isMobileControlsHidden}
               show={showControls || !isGridView}
               isFullscreen={actualIsFullScreen}
               isInVoice={voiceState.channelId === props.channelId}
               channelId={props.channelId}
               mediaSources={mediaSources}
               onToggleFullscreen={toggleFullscreen}
            />
         )}
      </div>
   );

   if (isMobile) {
      return (
         <>
            {mobileCallIndicator}
            <Transition show={!isMobileCallHidden} appear>
               {call}
            </Transition>
         </>
      );
   }

   return call;
}
