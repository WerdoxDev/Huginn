import VoiceControls from "@components/VoiceControls";
import VoiceElement from "@components/voice/VoiceElement";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHover } from "@hooks/useHover";
import { useLookup } from "@hooks/useLookup";
import { useConsumeStream } from "@hooks/voice/useConsumeStream";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import type { Snowflake, Unpacked } from "@huginn/shared";
import { useClient, useClientStore } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useSettings } from "@stores/settingsStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore, voiceStore } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { AnimatePresence } from "motion/react";
import { usePostHog } from "posthog-js/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const minHeight = 250;
const maxHeightPercentage = 60;

export default function DirectChannelCall(props: { channelId: Snowflake }) {
   const { localVoiceState, voiceStates, callStates, remoteSources, speakingStates, voiceChannel } = useVoiceStore();
   const { connect, changeStream, disconnect, startAudioStream, startCamera, startScreenShare, toggleDeafen, toggleMute, endCamera, endStream } =
      useVoiceUtils();
   const { voiceStatus } = useClientStore();

   const client = useClient();
   const { user } = useThisUser();
   const posthog = usePostHog();

   const consumeStreamMutation = useConsumeStream();

   const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId, localVoiceState]);
   const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);
   const isGridView = useMemo(() => thisVoiceStates.some((x) => x.isStreaming || x.isCameraOn), [thisVoiceStates]);

   const users = useUsers(Array.from(new Set([...(thisCallState?.ringing ?? []), ...thisVoiceStates.map((x) => x.userId)])));
   const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);
   const streamVideoRemoteSources = useLookup(
      remoteSources,
      (x) => x.userId,
      (x) => x.kind === "stream_video",
   );
   const streamAudioRemoteSources = useLookup(
      remoteSources,
      (x) => x.userId,
      (x) => x.kind === "stream_audio",
   );

   const isShown = useMemo(() => users.length !== 0 && thisCallState, [props.channelId, users, thisCallState]);

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
   // const maximizedSourceId = useRef<string | undefined>(undefined);
   const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof remoteSources> | undefined>(undefined);

   useEffect(() => {
      if (!voiceChannel.channelId) {
         setMaximizedSource(undefined);
      }
   }, [localVoiceState]);

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

            // When we exit fullscreen, the element is still here. Which we can use to detect we are exiting fullscreen and should not fiddle with the height
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
      const unlisten = client?.voice.listen("producer_closed", (d) => {
         if (d.producerId === maximizedSource?.producerId) {
            setMaximizedSource(undefined);
         }
      });

      const unlisten2 = client?.voice.listen("consumer_closed", (d) => {
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
   }, [remoteSources, gridHeight, thisCallState, maximizedSource, isFullscreen, thisVoiceStates, isGridView]);

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

   async function onConsumeStream(userId: Snowflake) {
      posthog.capture("voice:watch_stream_button_click", { userId });

      if (!consumeStreamMutation.isPending) {
         consumeStreamMutation.mutate({
            guildId: null,
            channelId: props.channelId,
            userId,
         });
      }
   }

   function maximizeSource(producerId: string) {
      const foundSource = remoteSources.find(
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
           store.voiceStates.filter((x) => x.isStreaming).length +
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
               elementWidth,
               elementHeight,
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
            className={clsx("flex w-full shrink flex-wrap content-center items-center justify-center gap-3", !maximizedSource && "px-5 py-2 pb-16")}
            ref={gridRef}
            style={{ height: !isFullscreen ? gridHeight : "100%" }}
         >
            <AnimatePresence mode="popLayout">
               {/* Watchable Streams whens not connected */}
               {(voiceStatus !== "rtc_ready" || voiceChannel.channelId !== props.channelId) &&
                  thisVoiceStates
                     .filter(
                        (x) => x.userId !== user.id && x.isStreaming && !streamAudioRemoteSources[x.userId] && !streamVideoRemoteSources[x.userId],
                     )
                     .map((x) => (
                        <VoiceElement
                           key={`${x.userId}-stream`}
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           userId={x.userId}
                           channelId={props.channelId}
                           onConsume={onConsumeStream}
                           isResizing={isResizing}
                           isGridView={isGridView}
                           isMaximized={!!maximizedSource}
                           isUnknown
                        />
                     ))}
               {/* Watching/Watchable Streams when connected */}
               {isGridView &&
                  voiceChannel.channelId === props.channelId &&
                  remoteSources
                     .filter((x) => {
                        if (maximizedSource) {
                           return x.producerId === maximizedSource.producerId && maximizedSource.kind !== "camera";
                        }

                        const hasAudioStream = x.producerId === streamAudioRemoteSources[x.userId]?.producerId;
                        const hasVideoStream = x.producerId === streamVideoRemoteSources[x.userId]?.producerId;

                        return hasVideoStream || (hasAudioStream && !streamVideoRemoteSources[x.userId]);
                     })
                     .map((x) => (
                        <VoiceElement
                           key={`${x.userId}-stream`}
                           remoteSource={x}
                           userId={x.userId}
                           channelId={props.channelId}
                           isMaximized={!!maximizedSource}
                           onClick={maximizeSource}
                           onConsume={onConsumeStream}
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           isResizing={isResizing}
                           isGridView={isGridView}
                        />
                     ))}
               {/* Normals user / cameras */}
               {thisVoiceStates
                  .filter((x) =>
                     maximizedSource
                        ? remoteSources.some((y) => y.userId === x.userId && y.kind === "camera" && maximizedSource.kind === "camera")
                        : true,
                  )
                  .map((x) => (
                     <VoiceElement
                        key={`${x.userId}-element`}
                        gridElementWidth={gridSize?.elementWidth ?? 0}
                        remoteSource={
                           remoteSources.find((y) => y.userId === x.userId && y.kind === "camera") ??
                           remoteSources.find((y) => y.userId === x.userId && y.kind === "microphone")
                        }
                        userId={x.userId}
                        channelId={props.channelId}
                        onClick={maximizeSource}
                        isResizing={isResizing}
                        isGridView={isGridView}
                        isSpeaking={usersSpeakingLookup[x.userId]?.speaking}
                        isMaximized={!!maximizedSource}
                        voiceState={x}
                     />
                  ))}
               {/* Ringing Users */}
               {!maximizedSource &&
                  thisCallState?.ringing.map((x) => (
                     <VoiceElement
                        key={x}
                        isRinging
                        gridElementWidth={gridSize?.elementWidth ?? 0}
                        isGridView={isGridView}
                        userId={x}
                        channelId={props.channelId}
                        isResizing={isResizing}
                     />
                  ))}
            </AnimatePresence>
         </div>
         <VoiceControls
            show={showControls || !isGridView}
            isFullscreen={isFullscreen}
            isInVoice={voiceChannel.channelId === props.channelId}
            onConnect={() => connect(props.channelId)}
            onDisconnect={disconnect}
            onStartScreenShare={startScreenShare}
            onStartAudioStream={startAudioStream}
            onStartCamera={startCamera}
            onStopCamera={endCamera}
            onEndStream={endStream}
            onChangeStream={changeStream}
            onToggleDeafen={toggleDeafen}
            onToggleFullscreen={toggleFullscreen}
            onToggleMute={toggleMute}
            voiceState={localVoiceState}
         />
      </div>
   );
}
