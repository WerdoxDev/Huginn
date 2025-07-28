import VoiceControls from "@components/VoiceControls";
import VoiceElement from "@components/voice/VoiceElement";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHover } from "@hooks/useHover";
import { useLookup } from "@hooks/useLookup";
import { useConsumeStream } from "@hooks/voice/useConsumeStream";
import { useStartCamera } from "@hooks/voice/useStartCamera";
import { useUpdateVoiceState } from "@hooks/voice/useUpdateVoiceState";
import type { Snowflake, Unpacked } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useSettings } from "@stores/settingsStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore, voiceClient, voiceStore } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { AnimatePresence } from "motion/react";
import { usePostHog } from "posthog-js/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const minHeight = 250;
const maxHeightPercentage = 60;

export default function DirectChannelCall(props: { channelId: Snowflake }) {
   const { localVoiceState, voiceStates, callStates, remoteSources, speakingStates } = useVoiceStore();

   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();

   const client = useClient();
   const { user } = useThisUser();
   const settings = useSettings();
   const posthog = usePostHog();

   const startCameraMutation = useStartCamera();
   const consumeStreamMutation = useConsumeStream();
   const updateVoiceStateMutation = useUpdateVoiceState();

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

   const isShown = useMemo(() => users.length !== 0 && thisCallState, [props.channelId, users]);

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
   const [isRecvTransportReady, setIsRecvTransportReady] = useState(false);
   const { isFullscreen, toggleFullscreen: onToggleFullscreen } = useFullscreen(containerRef);
   const maximizedSourceId = useRef<string | undefined>(undefined);
   const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof remoteSources> | undefined>(undefined);

   useEffect(() => {
      if (!localVoiceState.channelId) {
         maximizedSourceId.current = undefined;
         setMaximizedSource(undefined);
      }
   }, [localVoiceState]);

   useLayoutEffect(() => {
      const controller = new AbortController();

      window.addEventListener(
         "resize",
         () => {
            if (!gridRef.current) {
               return;
            }

            updateGridSize();
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
   }, [isShown]);

   useEffect(() => {
      const unlisten = client.voice.listen("producer_closed", (d) => {
         if (d.producerId === maximizedSourceId.current) {
            maximizedSourceId.current = undefined;
            setMaximizedSource(undefined);
         }
      });

      const unlisten2 = client.voice.listen("consumer_closed", (d) => {
         if (d.producerId === maximizedSourceId.current) {
            maximizedSourceId.current = undefined;
            setMaximizedSource(undefined);
         }
      });

      // This is to determine when we "technically" get all the voice remote sources added to our state to switch to the VoiceElements that are for when we are "connected"
      const unlisten3 = client.voice.listen("recv_transport_ready", () => {
         setIsRecvTransportReady(true);
      });

      const unlisten4 = client.voice.listen("close", () => {
         setIsRecvTransportReady(false);
      });

      return () => {
         unlisten();
         unlisten2();
         unlisten3();
         unlisten4();
      };
   }, []);

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

   function onDisconnect() {
      posthog.capture("voice:disconnect_button_click");
      client.gateway.disconnectVoice();
   }

   function onToggleMute() {
      posthog.capture("voice:toggle_mute_button_click");

      updateVoiceStateMutation.mutate({
         isAudioMuted: !localVoiceState.isAudioMuted,
         isAudioDeafened: false,
         isStreaming: localVoiceState.isStreaming,
         isCameraOn: localVoiceState.isCameraOn,
      });
   }

   function onToggleDeafen() {
      posthog.capture("voice:toggle_deafen_button_click");

      updateVoiceStateMutation.mutate({
         isAudioMuted: !localVoiceState.isAudioDeafened,
         isAudioDeafened: !localVoiceState.isAudioDeafened,
         isStreaming: localVoiceState.isStreaming,
         isCameraOn: localVoiceState.isCameraOn,
      });
   }

   async function onStartScreenShare() {
      posthog.capture("voice:screen_share_button_click");

      if (isFullscreen) {
         onToggleFullscreen();
      }

      if (huginnWindow.environment === "browser") {
         const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
         });
         await client.voice.startStream(stream.getVideoTracks()[0], stream.getAudioTracks()[0]);
      } else {
         updateModals({ screenShare: { isOpen: true } });
      }
   }

   function onStartAudioStream() {
      posthog.capture("voice:stream_audio_button_click");

      if (isFullscreen) {
         onToggleFullscreen();
      }

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      updateModals({ streamAudio: { isOpen: true } });
   }

   function onChangeStream() {
      const audioRemoteSource = remoteSources.find((x) => x.userId === user?.id && x.kind === "stream_audio");
      const videoRemoteSource = remoteSources.find((x) => x.userId === user?.id && x.kind === "stream_video");

      // Pure audio stream
      if (audioRemoteSource && !videoRemoteSource) {
         onStartAudioStream();
      } else {
         onStartScreenShare();
      }
   }

   function onStartCamera() {
      posthog.capture("voice:video_button_click");

      if (!startCameraMutation.isPending) {
         startCameraMutation.mutate({ deviceId: settings.local.cameraDeviceId });
      }
   }

   async function onConsumeStream(userId: Snowflake) {
      posthog.capture("voice:watch_stream_button_click", { userId });

      console.log(consumeStreamMutation.isPending);
      if (!consumeStreamMutation.isPending) {
         consumeStreamMutation.mutate({
            guildId: null,
            channelId: props.channelId,
            userId,
         });
      }
   }

   function maximizeSource(producerId: string) {
      if (maximizedSource) {
         maximizedSourceId.current = undefined;
         setMaximizedSource(undefined);
      } else {
         maximizedSourceId.current = producerId;
         const foundSource = remoteSources.find(
            (x) => x.producerId === maximizedSourceId.current && (x.kind === "stream_video" || x.kind === "camera" || x.kind === "stream_audio"),
         );
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
      const numBoxes = maximizedSourceId.current
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
      const boxMargin = !maximizedSourceId.current ? 12 : 0;
      const padding = {
         top: !maximizedSourceId.current ? 12 : 0,
         right: !maximizedSourceId.current ? 20 : 0,
         bottom: !maximizedSourceId.current ? 64 : 0,
         left: !maximizedSourceId.current ? 20 : 0,
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
            "group/wrapper shadow-surface-deep/50 relative z-10 flex shrink-0 select-none flex-col gap-y-3 overflow-hidden shadow-lg",
            isFullscreen ? "bg-surface-deep rounded-none" : "ring-primary-800 m-2 mb-0 rounded-xl bg-black/50 ring-2",
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
               {!isRecvTransportReady &&
                  thisVoiceStates
                     .filter(
                        (x) => x.userId !== user.id && x.isStreaming && !streamAudioRemoteSources[x.userId] && !streamVideoRemoteSources[x.userId],
                     )
                     .map((x) => (
                        <VoiceElement
                           remoteSource={{
                              kind: "unknown",
                              producerId: "",
                              userId: x.userId,
                           }}
                           key={`${x.userId}-stream`}
                           gridElementWidth={gridSize?.elementWidth ?? 0}
                           userId={x.userId}
                           channelId={props.channelId}
                           onConsume={onConsumeStream}
                           isResizing={isResizing}
                           isGridView={isGridView}
                           isMaximized={!!maximizedSource}
                        />
                     ))}
               {/* Watching/Watchable Streams when connected */}
               {isGridView &&
                  remoteSources
                     .filter((x) => {
                        if (maximizedSource) {
                           return x.producerId === maximizedSource.producerId;
                        }

                        const hasAudioStream = x.producerId === streamAudioRemoteSources[x.userId]?.producerId;
                        const hasVideoStream = x.producerId === streamVideoRemoteSources[x.userId]?.producerId;

                        return hasVideoStream || (hasAudioStream && !hasVideoStream);
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
                        isRinging={true}
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
            show={showControls}
            isFullscreen={isFullscreen}
            isInVoice={localVoiceState.channelId === props.channelId}
            onConnect={() => voiceClient.connect(null, props.channelId)}
            onDisconnect={onDisconnect}
            onStartScreenShare={onStartScreenShare}
            onStartAudioStream={onStartAudioStream}
            onStartCamera={onStartCamera}
            onStopCamera={() => client.voice.stopCamera()}
            onEndStream={() => client.voice.stopStream()}
            onChangeStream={onChangeStream}
            onToggleDeafen={onToggleDeafen}
            onToggleFullscreen={onToggleFullscreen}
            onToggleMute={onToggleMute}
            voiceState={localVoiceState}
         />
      </div>
   );
}
