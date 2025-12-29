import type { MediaSource } from "@/types";
import LoadingIcon from "@components/LoadingIcon";
import VoiceControls from "@components/VoiceControls";
import VoiceElement from "@components/voice/VoiceElement";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHover } from "@hooks/useHover";
import { useLookup } from "@hooks/useLookup";
import { useMediaSources } from "@hooks/voice/useMediaSources";
import type { Snowflake, Unpacked } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore, voiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const minHeight = 250;
const maxHeightPercentage = 60;

export default function DirectChannelCall(props: { channelId: Snowflake }) {
   const { voiceConnection, voiceState, voiceStates, callStates, speakingStates } = useVoiceStore();

   const client = useClient();
   const { user } = useThisUser();
   const posthog = usePostHog();

   const mediaSources = useMediaSources();

   const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId]);
   const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);
   const isGridView = useMemo(() => thisVoiceStates.some((x) => x.isAudioStreaming || x.isScreenSharing || x.isCameraOn), [thisVoiceStates]);

   const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);

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
   const { isFullscreen, toggleFullscreen } = useFullscreen();
   const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof mediaSources> | undefined>(undefined);

   useEffect(() => {
      if (maximizedSource && !mediaSources.some((x) => x.producerId === maximizedSource.producerId)) {
         setMaximizedSource(undefined);
      }
   }, [mediaSources]);

   useEffect(() => {
      if (!voiceConnection.channelId) {
         setMaximizedSource(undefined);
      }
   }, [voiceState]);

   useEffect(() => {
      setMaximizedSource(undefined);
   }, [props.channelId]);

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
   }, [isShown, maximizedSource]);

   useEffect(() => {
      const unlisten = client?.voice.transport.listen("producer_closed", (d) => {
         if (d.producerId === maximizedSource?.producerId) {
            setMaximizedSource(undefined);
         }
      });

      const unlisten2 = client?.voice.transport.listen("consumer_closed", (d) => {
         if (d.producerId === maximizedSource?.producerId) {
            setMaximizedSource(undefined);
         }
      });

      return () => {
         unlisten?.();
         unlisten2?.();
      };
   }, [maximizedSource]);

   useLayoutEffect(() => {
      updateGridSize();
   }, [mediaSources, gridHeight, thisCallState, maximizedSource, isFullscreen, thisVoiceStates, isGridView]);

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

   function resize(e: MouseEvent) {
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

   function updateGridSize() {
      if (!gridRef.current) {
         return;
      }

      const store = voiceStore.getState();
      const numBoxes = maximizedSource?.producerId
         ? 1
         : // People in voice
           store.voiceStates.length +
           // Streams
           store.voiceStates.filter((x) => x.isAudioStreaming || x.isScreenSharing).length +
           // People getting ringed
           (thisCallState?.ringing.length ?? 0);
      //

      const containerWidth = gridRef.current.clientWidth;
      const containerHeight = gridRef.current.clientHeight;
      const boxMargin = !maximizedSource?.producerId ? 12 : 0;
      const padding = {
         top: !maximizedSource?.producerId ? 12 : 0,
         right: !maximizedSource?.producerId ? 20 : 0,
         bottom: !maximizedSource?.producerId ? 64 : 0,
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
   }

   if (!user || !isShown) {
      return;
   }

   return (
      <div
         className={clsx(
            "group/wrapper shadow-surface-deep/50 z-10 flex shrink-0 select-none flex-col gap-y-3 overflow-hidden shadow-lg",
            isFullscreen ? "bg-surface-deep z-997 fixed inset-0 rounded-none" : "ring-primary-800 relative m-2 mb-0 rounded-xl bg-black/50 ring-2",
         )}
         ref={containerRef}
      >
         <div ref={resizerRef} className="absolute inset-x-0 -bottom-1 z-10 h-2 cursor-ns-resize" />
         <div
            className={clsx(
               "flex w-full shrink flex-wrap content-center items-center justify-center gap-3",
               !maximizedSource && "px-5 py-2",
               !isLoading && !maximizedSource && "pb-16",
            )}
            ref={gridRef}
            style={{ height: !isFullscreen ? gridHeight : "100%" }}
         >
            {isLoading ? (
               <LoadingIcon className="size-16" />
            ) : (
               <>
                  {/* Consumable or consuming streams */}
                  {thisVoiceStates
                     .filter(
                        (x) =>
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
                           isConnected={voiceConnection.channelId === props.channelId}
                           isResizing={isResizing}
                           isGridView={isGridView}
                           isMaximized={!!maximizedSource}
                           mediaSource={streamVideoSources[x.userId] ?? streamAudioSources[x.userId]}
                           secondMediaSource={streamVideoSources[x.userId] && streamAudioSources[x.userId]}
                           voiceState={x}
                           onClick={voiceConnection.channelId === props.channelId ? maximizeSource : undefined}
                        />
                     ))}
                  {/* Normals user / cameras */}
                  {thisVoiceStates
                     .filter((x) => (maximizedSource ? x.userId === maximizedSource.userId && maximizedSource.kind === "camera" : true))
                     .map((x) => (
                        <VoiceElement
                           type="normal"
                           key={`${x.userId}-element`}
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           gridElementHeight={gridSize?.elementHeight ?? 0}
                           mediaSource={cameraSources[x.userId] ?? microphoneSources[x.userId]}
                           secondMediaSource={cameraSources[x.userId] !== undefined ? microphoneSources[x.userId] : undefined}
                           userId={x.userId}
                           channelId={props.channelId}
                           guildId={null}
                           onClick={maximizeSource}
                           isResizing={isResizing}
                           isGridView={isGridView}
                           isSpeaking={usersSpeakingLookup[x.userId]?.speaking}
                           isMaximized={!!maximizedSource}
                           isConnected={voiceConnection.channelId === props.channelId}
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
                           isConnected={voiceConnection.channelId === props.channelId}
                           isResizing={isResizing}
                        />
                     ))}
               </>
            )}
         </div>
         {!isLoading && (
            <VoiceControls
               show={showControls || !isGridView}
               isFullscreen={isFullscreen}
               isInVoice={voiceConnection.channelId === props.channelId}
               channelId={props.channelId}
               mediaSources={mediaSources}
               onToggleFullscreen={toggleFullscreen}
            />
         )}
      </div>
   );
}
