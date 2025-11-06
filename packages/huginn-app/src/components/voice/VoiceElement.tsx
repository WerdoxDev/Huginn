import LoadingIcon from "@components/LoadingIcon";
import UserAvatar from "@components/UserAvatar";
import { useUser } from "@hooks/api-hooks/userHooks";
import type { GatewayVoiceState, Snowflake } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import { type MouseEvent, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import type { MediaSource } from "@/types";
import VoiceAudioVisualizer from "./VoiceAudioVisualizer";
import { VoiceLabel } from "./VoiceLabel";
import VoiceVideoStats from "./VoiceVideoStats";
import { useClientStore } from "@stores/clientStore";
import Tooltip from "@components/tooltip/Tooltip";

export default function VoiceElement(props: {
   userId: Snowflake;
   channelId: Snowflake;
   mediaSource?: MediaSource;
   secondMediaSource?: MediaSource;
   gridElementWidth: number;
   gridElementHeight: number;
   type: "normal" | "stream";
   isConnected: boolean;
   isMaximized?: boolean;
   isResizing?: boolean;
   isGridView?: boolean;
   isRinging?: boolean;
   isSpeaking?: boolean;
   voiceState?: GatewayVoiceState;
   onClick?: (producerId: string) => void;
   onConsume?: (userId: Snowflake) => void;
   ref?: RefObject<HTMLDivElement>;
}) {
   const { open: openContextMenu } = useContextMenu("voice_element");
   // const { remoteSources } = useVoiceStore();
   const { voiceStatus } = useClientStore();
   const videoRef = useRef<HTMLVideoElement>(null);
   const { user: thisUser } = useThisUser();
   const user = useUser(props.userId);

   const [isVideoMetaLoaded, setIsVideoMetaLoaded] = useState(false);
   // const consumeState = useMutationLatestState("consume-stream", ({ state: { variables } }) => variables?.userId === props.userId);

   const hasScreenShareAudio = useMemo(() => props.secondMediaSource?.kind === "stream_audio", [props.secondMediaSource]);

   const isCamera = useMemo(() => props.voiceState?.isCameraOn, [props.voiceState]);
   const isAudioStream = useMemo(() => props.type === "stream" && props.voiceState?.isAudioStreaming, [props.mediaSource]);
   const isScreenShare = useMemo(() => props.type === "stream" && props.voiceState?.isScreenSharing, [props.mediaSource]);
   const isPreview = useMemo(
      () => (isCamera || isAudioStream || isScreenShare) && !props.mediaSource?.consumerId && props.userId !== thisUser?.id,
      [props.mediaSource, isCamera, isAudioStream, isScreenShare],
   );

   const isDisconnected = useMemo(
      () => voiceStatus === "ready" && props.userId !== thisUser?.id && !props.mediaSource && !props.isRinging,
      [voiceStatus, props.mediaSource],
   );

   // const isLoadingStream = useMemo(
   //    () => consumeState && (isScreenShare || isAudioStream) && (consumeState.status === "pending" || (isCamera && !isVideoMetaLoaded)),
   //    [consumeState?.status, isVideoMetaLoaded, isScreenShare, isAudioStream],
   // );
   const isLoadingStream = useMemo(() => false, []);

   function consume(e: MouseEvent) {
      e.stopPropagation();
      props.onConsume?.(props.userId);
   }

   function onContextMenu(e: MouseEvent<HTMLDivElement>) {
      if (props.userId === thisUser?.id || !user || !props.mediaSource) {
         return;
      }

      openContextMenu(
         {
            user: user,
            mediaSource: props.mediaSource,
            secondMediaSource: props.secondMediaSource,
            channelId: props.channelId,
         },
         e,
      );
   }

   useEffect(() => {
      if (videoRef.current) {
         setIsVideoMetaLoaded(false);
         videoRef.current.onloadedmetadata = () => {
            setIsVideoMetaLoaded(true);
         };

         // Check if track is actually different
         const currentTrack = (videoRef.current.srcObject as MediaStream | undefined)?.getVideoTracks()[0];
         if (currentTrack?.id === props.mediaSource?.track?.id) {
            return;
         }

         const newStream = props.mediaSource?.track ? new MediaStream([props.mediaSource.track]) : null;
         videoRef.current.srcObject = newStream;
      }
   }, [props.mediaSource, props.voiceState]);

   return (
      <div
         ref={props.ref}
         onClick={() => props.onClick?.(props.mediaSource?.producerId ?? "")}
         style={{
            width: props.isGridView ? props.gridElementWidth : "auto",
            height: props.isGridView ? props.gridElementHeight : "auto",
            borderRadius: props.isMaximized ? "0px" : "12px",
         }}
         onContextMenu={onContextMenu}
         id={props.mediaSource?.consumerId}
         className={clsx(
            "group/element relative flex shrink-0 flex-col items-center justify-center gap-y-1 shadow-md hover:shadow-xl",
            props.onClick && "cursor-pointer",
            props.isGridView && "overflow-hidden p-0",
            props.isSpeaking && "ring-positive-100! ring-2!",
            props.isRinging ? "bg-surface/50" : "bg-surface",
            !props.isMaximized && "ring-surface ring-2",
         )}
      >
         {isDisconnected && (
            <Tooltip>
               <Tooltip.Content>Disconnected</Tooltip.Content>
               <Tooltip.Trigger className="absolute left-0.5 top-0.5">
                  <IconMingcuteWifiOffLine className="text-caution-100 size-7" />
               </Tooltip.Trigger>
            </Tooltip>
         )}
         {!isCamera && !isAudioStream && !isScreenShare && !isPreview && (
            <div className={clsx("p-5", props.isRinging && "animate-pulse", props.isGridView && "w-max")}>
               <div>
                  <UserAvatar userId={props.userId} avatarHash={user?.avatar} size={props.isGridView ? "5rem" : "4rem"} hideStatus />
               </div>
            </div>
         )}
         {!isPreview && !isLoadingStream && (isCamera || isScreenShare) && (
            <VoiceVideoStats
               hasAudio={hasScreenShareAudio}
               kind={props.mediaSource?.kind}
               videoRef={videoRef}
               track={props.mediaSource?.track ?? undefined}
            />
         )}
         <VoiceLabel userId={props.userId} isGridView={props.isGridView} voiceState={props.voiceState} type={props.type} />
         {isLoadingStream ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
               <LoadingIcon className="size-12" />
            </div>
         ) : (
            isPreview && (
               <button
                  className={clsx(
                     "group/watch flex h-full w-full cursor-pointer items-center justify-center bg-black/80 transition-colors",
                     !isCamera && "hover:bg-black/60",
                  )}
                  onClick={consume}
                  type="button"
               >
                  {isCamera ? (
                     <IconMingcuteCamera2Fill className="size-10 text-white" />
                  ) : (
                     <div className="bg-surface text-text rounded-lg px-3 py-1.5 transition-colors">
                        {isScreenShare ? "Watch Stream" : isAudioStream ? "Listen to Stream" : ""}
                     </div>
                  )}
               </button>
            )
         )}
         {props.isConnected && (isCamera || (isScreenShare && !isPreview)) && (
            <video
               className="absolute bg-black"
               style={{ width: props.gridElementWidth, height: props.gridElementHeight }}
               ref={videoRef}
               autoPlay
               playsInline
               muted
            />
         )}
         {!isPreview && isAudioStream && <VoiceAudioVisualizer track={props.mediaSource?.track ?? undefined} />}
      </div>
   );
}
