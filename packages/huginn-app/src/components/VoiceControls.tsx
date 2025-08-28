import { Transition } from "@headlessui/react";
import type { GatewayVoiceStateFlags } from "@huginn/shared";
import clsx from "clsx";
import DropdownMenu from "./dropdown/DowndownMenu";
import Tooltip from "./tooltip/Tooltip";
import VoiceControlButton from "./button/VoiceControlButton";
import StreamButton from "./button/StreamButton";
import { useEffect, useState, type RefObject } from "react";
import { useHover } from "@hooks/useHover";

export default function VoiceControls(props: {
   show: boolean;
   isInVoice: boolean;
   isFullscreen: boolean;
   voiceState: GatewayVoiceStateFlags;
   onToggleMute: () => void;
   onToggleDeafen: () => void;
   onStartScreenShare: () => void;
   onStartAudioStream: () => void;
   onEndStream: () => void;
   onChangeStream: () => void;
   onStartCamera: () => void;
   onStopCamera: () => void;
   onDisconnect: () => void;
   onConnect: () => void;
   onToggleFullscreen: () => Promise<void>;
}) {
   const [forceShow, setForceShow] = useState(false);
   const [isMoving, setIsMoving] = useState(false);
   const [ref, isHovering] = useHover<HTMLDivElement>();

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
                     isActive={props.voiceState.isAudioMuted}
                     onClick={props.onToggleMute}
                     tooltip="Mute"
                     className={clsx(props.voiceState.isAudioDeafened && props.voiceState.isAudioMuted && "rounded-r-none")}
                  >
                     {props.voiceState.isAudioMuted ? <IconMingcuteMicOffFill className="size-6" /> : <IconMingcuteMicFill className="size-6" />}
                  </VoiceControlButton>
                  <VoiceControlButton
                     activeColor="negative"
                     activeHoverColor="negative"
                     isActive={props.voiceState.isAudioDeafened}
                     onClick={props.onToggleDeafen}
                     tooltip="Deafen"
                     className={clsx(props.voiceState.isAudioDeafened && props.voiceState.isAudioMuted && "rounded-l-none")}
                  >
                     {props.voiceState.isAudioDeafened ? (
                        <IconMingcuteVolumeOffFill className="size-6" />
                     ) : (
                        <IconMingcuteVolumeFill className="size-6" />
                     )}
                  </VoiceControlButton>
                  <div className="bg-surface mx-0.5 my-1 w-0.5 shrink-0" />
                  <div className="flex gap-x-1">
                     <StreamButton
                        voiceState={props.voiceState}
                        onStartScreenShare={props.onStartScreenShare}
                        onStartAudioStream={props.onStartAudioStream}
                        onEndStream={props.onEndStream}
                        onChangeStream={props.onChangeStream}
                        onOpenChanged={onStreamButtonOpenChanged}
                        anchor={{ gap: "12px", to: "top" }}
                     >
                        <VoiceControlButton
                           className={clsx(
                              "flex h-full items-center justify-center",
                              props.voiceState.isStreaming ? "w-[38px] rounded-r-none !p-0" : "w-16",
                           )}
                           activeHoverColor="negative"
                           activeColor="primary"
                           isActive={props.voiceState.isStreaming}
                           tooltip={props.voiceState.isStreaming ? "End Stream" : "Start Stream"}
                           onClick={props.voiceState.isStreaming ? props.onEndStream : undefined}
                           asChild={!props.voiceState.isStreaming}
                        >
                           {props.voiceState.isStreaming ? (
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
                        isActive={props.voiceState.isCameraOn}
                        onClick={() => (props.voiceState.isCameraOn ? props.onStopCamera() : props.onStartCamera())}
                        tooltip={props.voiceState.isCameraOn ? "Turn off camera" : "Turn on camera"}
                     >
                        <IconMingcuteCamera2Fill className="size-6" />
                     </VoiceControlButton>
                  </div>
               </div>
               <VoiceControlButton
                  color="negative"
                  hoverColor="negative"
                  onClick={props.onDisconnect}
                  tooltip="Disconnect"
                  className="rounded-xl px-5 py-2.5"
               >
                  <IconMingcutePhoneBlockFill className="size-6" />
               </VoiceControlButton>
            </>
         ) : (
            <VoiceControlButton color="positive" hoverColor="positive" onClick={props.onConnect} tooltip="Join" className="rounded-xl px-5 py-2.5">
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
