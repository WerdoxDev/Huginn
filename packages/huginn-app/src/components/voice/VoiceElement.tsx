import type { GatewayVoiceState, Snowflake, VoicePreference } from "@huginnjs/shared";

import LoadingIcon from "@components/LoadingIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import UserBanner from "@components/UserBanner";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { createRadialMaskStyle } from "@lib/mask-utils";
import { useClientStore } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import { type MouseEvent, type RefObject, useEffect, useMemo, useRef, useState } from "react";

import type { MediaSource } from "@/types";

import VoiceAudioVisualizer from "./VoiceAudioVisualizer";
import { VoiceLabel } from "./VoiceLabel";
import { VoiceStreamParticipants } from "./VoiceStreamParticipants";
import VoiceVideoStats from "./VoiceVideoStats";

export default function VoiceElement(props: {
   userId: Snowflake;
   channelId: Snowflake;
   guildId: Snowflake | null;
   mediaSource?: MediaSource;
   secondMediaSource?: MediaSource;
   voicePreference?: VoicePreference;
   gridElementWidth: number;
   gridElementHeight: number;
   type: "normal" | "stream";
   isConnected: boolean;
   isMaximized?: boolean;
   isResizing?: boolean;
   isGridView?: boolean;
   isRinging?: boolean;
   isSpeaking?: boolean;
   avatarImageSrc?: string | null;
   bannerImageSrc?: string | null;
   voiceState?: GatewayVoiceState;
   onClick?: (producerId: string) => void;
   ref?: RefObject<HTMLDivElement>;
}) {
   const { open: openContextMenu } = useContextMenu("voice_element");
   const { consumeStream } = useVoiceUtils();
   const { voiceStatus } = useClientStore();
   const videoRef = useRef<HTMLVideoElement>(null);
   const { user: thisUser } = useThisUser();
   const user = useUser(props.userId);

   const [isHovered, setIsHovered] = useState(false);
   const [isLoadingStream, setIsLoadingStream] = useState(false);

   const hasScreenShareAudio = useMemo(() => props.secondMediaSource?.kind === "stream_audio", [props.secondMediaSource]);

   const isCamera = useMemo(() => props.type === "normal" && props.voiceState?.isCameraOn, [props.voiceState]);
   const isAudioStream = useMemo(() => props.type === "stream" && props.voiceState?.isAudioStreaming, [props.mediaSource]);
   const isScreenShare = useMemo(() => props.type === "stream" && props.voiceState?.isScreenSharing, [props.mediaSource]);
   const isPreview = useMemo(
      () => (isCamera || isAudioStream || isScreenShare) && !props.mediaSource?.consumerId && props.userId !== thisUser?.id,
      [props.mediaSource, isCamera, isAudioStream, isScreenShare],
   );

   const hasMutedIndicator = useMemo(
      () =>
         (props.type === "normal" &&
            (props.voiceState?.isAudioMuted || props.voiceState?.isAudioDeafened || props.voicePreference?.isMicrophoneMuted)) ||
         (props.type === "stream" && props.voicePreference?.isStreamMuted),
      [props.type, props.voicePreference, props.voiceState],
   );

   const isDisconnected = useMemo(
      () => voiceStatus === "ready" && props.userId !== thisUser?.id && !props.mediaSource && !props.isRinging,
      [voiceStatus, props.mediaSource],
   );

   async function consume(e: MouseEvent) {
      e.stopPropagation();

      setIsLoadingStream(true);
      await consumeStream(props.userId, props.guildId, props.channelId);
      setIsLoadingStream(false);
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
            guildId: props.guildId,
            channelId: props.channelId,
         },
         e,
      );
   }

   useEffect(() => {
      if (videoRef.current) {
         // Check if track is actually different
         const currentTrack = (videoRef.current.srcObject as MediaStream | undefined)?.getVideoTracks()[0];
         if (currentTrack?.id === props.mediaSource?.track?.id) {
            return;
         }

         const newStream = props.mediaSource?.track ? new MediaStream([props.mediaSource.track]) : null;
         videoRef.current.srcObject = newStream;
      }
   }, [props.mediaSource, props.voiceState]);

   const stateSize = 2;
   const stateRadius = stateSize / 2;
   // const indicatorMask = createRadialMaskStyle([
   //    {
   //       radius: `${stateRadius + 0.25}rem`,
   //       x: `calc(100% - 0.75rem + 2px)`,
   //       y: `calc(100% - 0.75rem + 2px)`,
   //    },
   // ]);
   const indicatorMask = createRadialMaskStyle([
      {
         radius: `${stateRadius + 0.25}rem`,
         x: `calc(100% - 0.75rem + 2px)`,
         y: `calc(100% - 0.75rem + 2px)`,
      },
   ]);

   return (
      <div
         ref={props.ref}
         onClick={() => props.onClick?.(props.mediaSource?.producerId ?? "")}
         style={{
            width: props.isGridView ? props.gridElementWidth : "auto",
            height: props.isGridView ? props.gridElementHeight : "auto",
            borderColor: user.accentColor ?? "transparent",
         }}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
         onContextMenu={onContextMenu}
         id={props.mediaSource?.consumerId}
         className={clsx(
            "group/element bg-surface-alt relative flex h-max w-max shrink-0 flex-col items-center justify-center gap-y-1",
            props.onClick && "cursor-pointer",
            props.isGridView && "p-0",
            !props.isMaximized && "rounded-lg border-2",
            props.isRinging && "animate-pulse",
         )}
      >
         {!isCamera && !isScreenShare && !isAudioStream && (
            <div className="absolute inset-0 overflow-hidden rounded-md">
               <UserBanner
                  hovered={isHovered}
                  userId={props.userId}
                  animatedMode="hover"
                  bannerColor={user.bannerColor}
                  bannerHash={user.banner}
                  imageSrc={props.bannerImageSrc}
               />
            </div>
         )}
         <div
            className={clsx(
               "transition-border pointer-events-none absolute z-10 border-2",
               props.isSpeaking ? "border-positive-300" : "border-transparent",
               props.isMaximized ? "inset-0" : "-inset-1.5 rounded-xl",
            )}
         />
         {isDisconnected && (
            <Tooltip>
               <Tooltip.Content>Disconnected</Tooltip.Content>
               <Tooltip.Trigger className="absolute top-0.5 left-0.5">
                  <IconMingcuteWifiOffLine className="text-caution-100 size-7" />
               </Tooltip.Trigger>
            </Tooltip>
         )}
         {!isCamera && !isAudioStream && !isScreenShare && !isPreview && (
            <div className={clsx("z-10 p-4.5", props.isRinging && "animate-pulse", props.isGridView && "w-max")}>
               <div
                  className="rounded-full"
                  // style={!props.isGridView && hasMutedIndicator ? indicatorMask : undefined}
               >
                  <UserAvatar
                     userId={props.userId}
                     avatarHash={user?.avatar}
                     imageSrc={props.avatarImageSrc}
                     size={props.isGridView ? 5 : 4}
                     hideStatus
                     animatedMode="hover"
                     hovered={isHovered}
                     maskStyle={!props.isGridView && hasMutedIndicator ? indicatorMask : undefined}
                  />
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
         {(isAudioStream || isScreenShare) && <VoiceStreamParticipants mediaSource={props.mediaSource} />}
         <VoiceLabel
            userId={props.userId}
            isGridView={props.isGridView}
            voicePreference={props.voicePreference}
            voiceState={props.voiceState}
            type={props.type}
         />
         {isLoadingStream ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
               <LoadingIcon className="size-12" />
            </div>
         ) : (
            isPreview && (
               <button
                  className={clsx(
                     "group/watch flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-black/80 transition-colors",
                     !isCamera && "hover:bg-black/60",
                  )}
                  onClick={!isCamera ? consume : undefined}
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
         {props.isConnected && (isCamera || isScreenShare) && !isPreview && (
            <video
               className={clsx("h-full w-full bg-black", !props.isMaximized && "rounded-lg")}
               // style={{ width: props.gridElementWidth - 2, height: props.gridElementHeight - 2 }}
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
