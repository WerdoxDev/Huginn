import type { Snowflake, Unpacked } from "@huginnjs/shared";

import UserAvatar from "@components/UserAvatar";
import AndroidAudioRouteSelect from "@components/voice/AndroidAudioRouteSelect";
import AndroidCameraFlipButton from "@components/voice/AndroidCameraFlipButton";
import VoiceElement from "@components/voice/VoiceElement";
import VoicePopoutIndicator from "@components/voice/VoicePopoutIndicator";
import VoicePopoutStatus from "@components/voice/VoicePopoutStatus";
import VoiceControls from "@components/VoiceControls";
import { Transition } from "@headlessui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { BackHandlerId, useBackHandler } from "@hooks/useBackHandler";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHover } from "@hooks/useHover";
import { useIsMobile } from "@hooks/useIsMobile";
import { useLookup } from "@hooks/useLookup";
import { useVoicePreferences } from "@hooks/useVoicePreferences";
import { useVoiceSnapshot } from "@hooks/voice/useMediaSources";
import { HuginnButton, HuginnLoadingIcon } from "@huginn/frontend-shared";
import { isChildWindow } from "@lib/child-window";
import { getVoiceGridLayout } from "@lib/voice-grid-layout";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
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

   const users = useUsers(thisVoiceStates.map((x) => x.userId));
   const usersLookup = useLookup(users, (user) => user.id);
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
   const gridViewportRef = useRef<HTMLDivElement>(null);
   const gridContentRef = useRef<HTMLDivElement>(null);
   const resizerRef = useRef<HTMLDivElement>(null);
   const [isResizing, setIsResizing] = useState(false);
   const [gridSize, setGridSize] = useState<{
      elementWidth: number;
      elementHeight: number;
   }>();
   const [gridHeight, setGridHeight] = useState(250);
   const [isMobileCallHidden, setIsMobileCallHidden] = useState(true);
   const [isMobileControlsHidden, setIsMobileControlHidden] = useState(true);
   const { isFullscreen: actualIsFullScreen, toggleFullscreen } = useFullscreen();
   const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof mediaSources> | undefined>(undefined);
   const previousChannelId = useRef<Snowflake | undefined>(undefined);
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
         previousChannelId.current = undefined;
      } else if (voiceState.channelId === props.channelId && previousChannelId.current !== voiceState.channelId) {
         setIsMobileCallHidden(false);
         previousChannelId.current = props.channelId;
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
      const observer = new ResizeObserver(() => updateGridSize());
      if (gridViewportRef.current) {
         observer.observe(gridViewportRef.current);
      }

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
         observer.disconnect();
      };
   }, [isShown, maximizedSource, isMobileCallHidden, isMobile]);

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
      if (!gridViewportRef.current || !gridContentRef.current) {
         return;
      }

      const openMediaPopoutProducers = popoutState.openMediaPopoutProducers;
      const numBoxes = maximizedSource?.producerId
         ? 1
         : // People in voice
           thisVoiceStates.filter((x) => !openMediaPopoutProducers.includes(cameraSources[x.userId]?.producerId ?? "")).length +
           // Streams
           thisVoiceStates.filter(
              (x) =>
                 (x.isAudioStreaming || x.isScreenSharing) &&
                 !openMediaPopoutProducers.includes((streamVideoSources[x.userId] || streamAudioSources[x.userId])?.producerId ?? ""),
           ).length +
           // People getting ringed
           (thisCallState?.ringing.length ?? 0);

      const contentStyle = getComputedStyle(gridContentRef.current);
      const width = Math.max(0, gridViewportRef.current.clientWidth - parseFloat(contentStyle.paddingLeft) - parseFloat(contentStyle.paddingRight));
      const height = Math.max(0, gridViewportRef.current.clientHeight - parseFloat(contentStyle.paddingTop) - parseFloat(contentStyle.paddingBottom));
      const nextSize = maximizedSource
         ? { elementWidth: width, elementHeight: height }
         : getVoiceGridLayout(numBoxes, width, height, parseFloat(contentStyle.columnGap));

      setGridSize((previous) =>
         previous?.elementWidth === nextSize.elementWidth && previous.elementHeight === nextSize.elementHeight ? previous : nextSize,
      );
   });

   if (!user || !isShown) {
      return;
   }

   const mobileCallIndicator = (
      <div className={clsx("fixed inset-x-3 top-20 z-20 transition-opacity", isMobileCallHidden ? "opacity-100" : "pointer-events-none opacity-0")}>
         <HuginnButton
            color="primary"
            className="ring-primary-300 relative flex w-full items-center p-1 px-2 text-white shadow-md ring"
            onClick={() => setIsMobileCallHidden(false)}
         >
            <div className="flex items-center gap-x-1">
               {thisVoiceStates.slice(0, 2).map((x) => (
                  <UserAvatar userId={x.userId} avatarHash={usersLookup[x.userId].avatar} hideStatus size={2} key={x.userId} />
               ))}

               {thisVoiceStates.length > 2 && (
                  <div className="bg-primary-800 flex size-8 items-center justify-center rounded-full text-sm">{thisVoiceStates.length - 2}</div>
               )}
            </div>
            <div className="absolute inset-x-0 text-center">In Call</div>
            <div className="ml-auto flex items-center gap-x-1">
               {voiceState.isCameraOn && <IconMingcuteCamera2Fill className="text-positive-300 size-5" />}
               {voiceState.isAudioMuted && <IconMingcuteMicOffFill className="text-negative-300 size-5" />}
               {voiceState.isAudioDeafened && <IconMingcuteVolumeOffFill className="text-negative-300 size-5" />}
            </div>
         </HuginnButton>
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

         <div className="flex min-h-0 w-full flex-col" ref={gridRef} style={{ height: !isOverlay ? gridHeight : "100%" }}>
            <div
               ref={gridViewportRef}
               className={clsx(
                  "scroll-thin min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain",
                  !maximizedSource && "scrollbar-gutter-both",
               )}
               style={{
                  maskImage:
                     !isLoading && !maximizedSource
                        ? "linear-gradient(to bottom, black calc(100% - 5rem), transparent calc(100% - 2.5rem))"
                        : undefined,
               }}
            >
               <div
                  ref={gridContentRef}
                  className={clsx(
                     "flex min-h-full w-full flex-wrap content-center items-center justify-center gap-x-3",
                     !maximizedSource && "px-5",
                     !maximizedSource && (isMobile ? "pt-16" : "pt-3"),
                     isGridView ? "gap-y-3" : "gap-y-12",
                     !maximizedSource && isGridView && (isLoading ? "pb-3" : "pb-23"),
                     !maximizedSource && !isGridView && (isLoading ? "pb-12" : "pb-32"),
                  )}
               >
                  {popoutState.isPopoutOpen && !isChildWindow() ? (
                     <div className="text-text flex items-center justify-center text-center">Voice is popped out in another window</div>
                  ) : isLoading ? (
                     <HuginnLoadingIcon className="size-16" />
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
            </div>
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
