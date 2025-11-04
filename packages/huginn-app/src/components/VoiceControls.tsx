import type { Snowflake } from "@huginn/shared";
import clsx from "clsx";
import Tooltip from "./tooltip/Tooltip";
import VoiceControlButton from "./button/VoiceControlButton";
import StreamButton from "./button/StreamButton";
import { useEffect, useState } from "react";
import { useHover } from "@hooks/useHover";
import { DropdownMenu } from "./dropdown/DropdownMenu";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { useVoiceStore } from "@stores/voiceStore";
import { useClient } from "@stores/clientStore";

export default function VoiceControls(props: {
   show: boolean;
   isInVoice: boolean;
   isFullscreen: boolean;
   channelId: Snowflake;
   onToggleFullscreen: () => Promise<void>;
}) {
   const client = useClient();
   const [forceShow, setForceShow] = useState(false);
   const [isMoving, setIsMoving] = useState(false);
   const [ref, isHovering] = useHover<HTMLDivElement>();
   const { toggleDeafen, toggleMute, closeCamera, changeStream, openCamera, openAudioStream, closeStream, openScreenShare } = useVoiceUtils();
   const { voiceState } = useVoiceStore();

   useEffect(() => {
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
   }, []);

   function onStreamButtonOpenChanged(isOpen: boolean) {
      setForceShow(isOpen);
   }

   async function onConnect() {
      await client?.voiceManager.connectVoice(null, props.channelId);
   }

   async function onDisconnect() {
      await client?.voiceManager.disconnectVoice();
   }

   return (
      <div
         className={clsx(
            "absolute inset-x-0 bottom-0 mb-2.5 flex shrink-0 items-center justify-center gap-x-2.5 transition-opacity",
            (props.show && isMoving) || forceShow || isHovering ? "opacity-100" : "opacity-0",
         )}
         ref={ref}
      >
         {props.isInVoice ? (
            <>
               <div className="border-surface bg-surface-deep flex gap-x-1 rounded-xl border p-1">
                  <VoiceControlButton
                     activeColor="negative"
                     activeHoverColor="negative"
                     isActive={voiceState.isAudioMuted}
                     onClick={toggleMute}
                     tooltip="Mute"
                     className={clsx(voiceState.isAudioDeafened && voiceState.isAudioMuted && "rounded-r-none")}
                  >
                     {voiceState.isAudioMuted ? <IconMingcuteMicOffFill className="size-6" /> : <IconMingcuteMicFill className="size-6" />}
                  </VoiceControlButton>
                  <VoiceControlButton
                     activeColor="negative"
                     activeHoverColor="negative"
                     isActive={voiceState.isAudioDeafened}
                     onClick={toggleDeafen}
                     tooltip="Deafen"
                     className={clsx(voiceState.isAudioDeafened && voiceState.isAudioMuted && "rounded-l-none")}
                  >
                     {voiceState.isAudioDeafened ? <IconMingcuteVolumeOffFill className="size-6" /> : <IconMingcuteVolumeFill className="size-6" />}
                  </VoiceControlButton>
                  <div className="bg-surface mx-0.5 my-1 w-0.5 shrink-0" />
                  <div className="flex gap-x-1">
                     <StreamButton
                        voiceState={voiceState}
                        onOpenScreenShare={openScreenShare}
                        onOpenAudioStream={openAudioStream}
                        onCloseStream={closeStream}
                        onChangeStream={changeStream}
                        onOpenChanged={onStreamButtonOpenChanged}
                        anchor={{ placement: "top", gap: 12 }}
                     >
                        <VoiceControlButton
                           className={clsx(
                              "flex h-full items-center justify-center",
                              voiceState.isAudioStreaming || voiceState.isScreenSharing ? "p-0! w-[38px] rounded-r-none" : "w-16",
                           )}
                           activeHoverColor="negative"
                           activeColor="primary"
                           isActive={voiceState.isAudioStreaming || voiceState.isScreenSharing}
                           tooltip={voiceState.isAudioStreaming || voiceState.isScreenSharing ? "End Stream" : "Start Stream"}
                           onClick={voiceState.isAudioStreaming || voiceState.isScreenSharing ? closeStream : undefined}
                           asChild={!voiceState.isAudioStreaming && !voiceState.isScreenSharing}
                        >
                           {voiceState.isAudioStreaming || voiceState.isScreenSharing ? (
                              <IconMingcuteCloseFill className="size-6" />
                           ) : (
                              <DropdownMenu.Button>
                                 <IconMingcuteMonitorFill className="size-5 shrink-0" />
                                 <div className="text-sm text-white/50">/</div>
                                 <IconMingcuteVolumeFill className="size-5 shrink-0" />
                              </DropdownMenu.Button>
                           )}
                        </VoiceControlButton>
                     </StreamButton>
                     <VoiceControlButton
                        activeColor="primary"
                        activeHoverColor="negative"
                        isActive={voiceState.isCameraOn}
                        onClick={() => (voiceState.isCameraOn ? closeCamera() : openCamera())}
                        tooltip={voiceState.isCameraOn ? "Turn off camera" : "Turn on camera"}
                     >
                        <IconMingcuteCamera2Fill className="size-6" />
                     </VoiceControlButton>
                  </div>
               </div>
               <VoiceControlButton
                  color="negative"
                  hoverColor="negative"
                  onClick={onDisconnect}
                  tooltip="Disconnect"
                  className="rounded-xl px-5 py-2.5"
               >
                  <IconMingcutePhoneBlockFill className="size-6" />
               </VoiceControlButton>
            </>
         ) : (
            <VoiceControlButton color="positive" hoverColor="positive" onClick={onConnect} tooltip="Join" className="rounded-xl px-5 py-2.5">
               <IconMingcutePhoneFill className="size-6" />
            </VoiceControlButton>
         )}
         <Tooltip>
            <Tooltip.Trigger onClick={props.onToggleFullscreen} className="text-text/60 hover:text-text absolute bottom-1 right-3 size-7">
               {!props.isFullscreen ? <IconMingcuteFullscreenFill className="size-7" /> : <IconMingcuteFullscreenExitFill className="size-7" />}
            </Tooltip.Trigger>
            <Tooltip.Content>{props.isFullscreen ? "Exit fullscreen" : "Fullscreen"}</Tooltip.Content>
         </Tooltip>
      </div>
      //  </Transition>
   );
}
