import { useHover } from "@hooks/useHover";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { type Snowflake } from "@huginnjs/shared";
import { VoiceClient } from "@lib/voice/voice-client";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { useEffect, useState, type MouseEvent } from "react";

import type { MediaSource } from "@/types";

import StreamButton from "./button/StreamButton";
import VoiceControlButton from "./button/VoiceControlButton";
import Tooltip from "./tooltip/Tooltip";

export default function VoiceControls(props: {
   show: boolean;
   isInVoice: boolean;
   isFullscreen: boolean;
   isMobile: boolean;
   isMobileControlsHidden: boolean;
   channelId: Snowflake;
   mediaSources: MediaSource[];
   onToggleFullscreen: () => Promise<void>;
}) {
   const client = useClient();
   const [forceShow, setForceShow] = useState(false);
   const [isMoving, setIsMoving] = useState(false);
   const [ref, isHovering] = useHover<HTMLDivElement>();
   const {
      toggleDeafen,
      toggleMute,
      closeCamera,
      changeStream,
      updateStream,
      openCamera,
      openAudioStream,
      closeStream,
      openScreenShare,
      openPopout,
   } = useVoiceUtils();
   const { voiceState } = useVoiceStore();
   const { updateModals } = useModals();

   const videoSource = props.mediaSources.find((x) => x.kind === "stream_video" && x.type === "producing");
   const audioSource = props.mediaSources.find((x) => x.kind === "stream_audio" && x.type === "producing");

   useEffect(() => {
      if (props.isMobile) return;

      const controller = new AbortController();

      let timeout: number | undefined;
      window.addEventListener(
         "mousemove",
         () => {
            setIsMoving(true);
            clearTimeout(timeout);
            timeout = window.setTimeout(() => {
               setIsMoving(false);
            }, 1000);
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort();
         clearTimeout(timeout);
      };
   }, [props.isMobile]);

   function handleStreamButtonOpenChanged(isOpen: boolean) {
      setForceShow(isOpen);
   }

   function handleConnect() {
      VoiceClient.sendMessage("connect_voice", { guildId: null, channelId: props.channelId }).catch(() => {
         updateModals({
            info: {
               isOpen: true,
               status: "error",
               title: "Connecting To Voice Failed",
               text: "Make sure you have an internet connection and try again.",
            },
         });
      });
   }

   async function handleDisconnect() {
      if (props.isMobile && props.isMobileControlsHidden) return;

      await VoiceClient.sendMessage("disconnect_voice");
   }

   function handleToggleCamera() {
      console.log(props.isMobileControlsHidden);
      if (props.isMobile && props.isMobileControlsHidden) return;

      if (voiceState.isCameraOn) closeCamera();
      else openCamera();
   }

   function handleToggleMute() {
      if (props.isMobile && props.isMobileControlsHidden) return;

      toggleMute();
   }

   function handleToggleDeafen() {
      if (props.isMobile && props.isMobileControlsHidden) return;

      toggleDeafen();
   }
   function handleClick(e: MouseEvent) {
      if (props.isMobile && props.isMobileControlsHidden) return;
      e.stopPropagation();
   }

   return (
      <div
         className={clsx(
            "absolute inset-x-0 bottom-0 z-10 flex shrink-0 justify-center transition-opacity",
            (props.show && isMoving) ||
               (props.isMobile && !props.isMobileControlsHidden) ||
               !props.isInVoice ||
               forceShow ||
               (!props.isMobile && isHovering)
               ? "opacity-100"
               : "opacity-0",
         )}
         ref={ref}
      >
         <div className="z-10 mb-2.5 flex items-center justify-center gap-x-2.5" onClick={handleClick}>
            {props.isInVoice ? (
               <>
                  <div className="border-surface bg-surface-deep flex gap-x-1 rounded-xl border p-1">
                     <VoiceControlButton
                        activeColor="negative"
                        activeHoverColor="negative"
                        isActive={voiceState.isAudioMuted}
                        onClick={handleToggleMute}
                        tooltip="Mute"
                        className={clsx(voiceState.isAudioDeafened && voiceState.isAudioMuted && "rounded-r-none")}
                     >
                        {voiceState.isAudioMuted ? <IconMingcuteMicOffFill className="size-6" /> : <IconMingcuteMicFill className="size-6" />}
                     </VoiceControlButton>
                     <VoiceControlButton
                        activeColor="negative"
                        activeHoverColor="negative"
                        isActive={voiceState.isAudioDeafened}
                        onClick={handleToggleDeafen}
                        tooltip="Deafen"
                        className={clsx(voiceState.isAudioDeafened && voiceState.isAudioMuted && "rounded-l-none")}
                     >
                        {voiceState.isAudioDeafened ? (
                           <IconMingcuteVolumeOffFill className="size-6" />
                        ) : (
                           <IconMingcuteVolumeFill className="size-6" />
                        )}
                     </VoiceControlButton>
                     <div className="bg-surface mx-0.5 my-1 w-0.5 shrink-0" />
                     <div className="flex gap-x-1">
                        {!props.isMobile && (
                           <StreamButton
                              voiceState={voiceState}
                              mediaSource={videoSource ?? audioSource}
                              onOpenScreenShare={openScreenShare}
                              onOpenAudioStream={openAudioStream}
                              onCloseStream={closeStream}
                              onChangeStream={changeStream}
                              onUpdateStream={updateStream}
                              onOpenChanged={handleStreamButtonOpenChanged}
                              // menu={{ side: "top", align: "center", sideOffset: 12 }}
                           >
                              <VoiceControlButton
                                 className={clsx(
                                    "flex h-full items-center justify-center",
                                    voiceState.isAudioStreaming || voiceState.isScreenSharing ? "w-9.5 rounded-r-none p-0!" : "w-16",
                                 )}
                                 activeHoverColor="negative"
                                 activeColor="primary"
                                 isActive={voiceState.isAudioStreaming || voiceState.isScreenSharing}
                                 tooltip={voiceState.isAudioStreaming || voiceState.isScreenSharing ? "End Stream" : "Start Stream"}
                                 onClick={voiceState.isAudioStreaming || voiceState.isScreenSharing ? closeStream : undefined}
                              >
                                 {voiceState.isAudioStreaming || voiceState.isScreenSharing ? (
                                    <IconMingcuteCloseFill className="size-6" />
                                 ) : (
                                    <div className="flex items-center gap-x-0.5">
                                       <IconMingcuteMonitorFill className="size-5 shrink-0" />
                                       <div className="text-sm text-white/50">/</div>
                                       <IconMingcuteVolumeFill className="size-5 shrink-0" />
                                    </div>
                                 )}
                              </VoiceControlButton>
                           </StreamButton>
                        )}
                        <VoiceControlButton
                           activeColor="primary"
                           activeHoverColor="negative"
                           isActive={voiceState.isCameraOn}
                           onClick={handleToggleCamera}
                           tooltip={voiceState.isCameraOn ? "Turn off camera" : "Turn on camera"}
                        >
                           <IconMingcuteCamera2Fill className="size-6" />
                        </VoiceControlButton>
                     </div>
                  </div>
                  <VoiceControlButton
                     color="negative"
                     hoverColor="negative"
                     onClick={handleDisconnect}
                     tooltip="Disconnect"
                     className="rounded-xl px-5 py-2.5"
                  >
                     <IconMingcutePhoneBlockFill className="size-6" />
                  </VoiceControlButton>
               </>
            ) : (
               <VoiceControlButton color="positive" hoverColor="positive" onClick={handleConnect} tooltip="Join" className="rounded-xl px-5 py-2.5">
                  <IconMingcutePhoneFill className="size-6" />
               </VoiceControlButton>
            )}
         </div>
         <div
            className={clsx(
               "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/50 to-transparent",
               !props.isFullscreen && "rounded-xl",
            )}
         ></div>
         {!props.isMobile && (
            <div className="absolute right-2.5 bottom-2.5 flex gap-x-2">
               {client?.voice.popout && props.isInVoice && (
                  <Tooltip>
                     <Tooltip.Trigger onClick={openPopout} className="text-text/60 hover:text-text size-7">
                        <IconMingcuteLayoutBottomOpenFill className="size-7" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>Popout</Tooltip.Content>
                  </Tooltip>
               )}
               <Tooltip>
                  <Tooltip.Trigger onClick={props.onToggleFullscreen} className="text-text/60 hover:text-text size-7">
                     {!props.isFullscreen ? <IconMingcuteFullscreenFill className="size-7" /> : <IconMingcuteFullscreenExitFill className="size-7" />}
                  </Tooltip.Trigger>
                  <Tooltip.Content>{props.isFullscreen ? "Exit fullscreen" : "Fullscreen"}</Tooltip.Content>
               </Tooltip>
            </div>
         )}
      </div>
   );
}
