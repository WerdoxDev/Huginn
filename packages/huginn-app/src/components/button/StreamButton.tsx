import type { MediaSource, ScreenShareFrameRate, ScreenShareQuality } from "@/types";
import { DropdownMenu, type DropdownAnchor } from "@components/dropdown/DropdownMenu";
import type { GatewayVoiceStateFlags } from "@huginn/shared";
import { screenShareFrameRates, screenShareQualities } from "@lib/constants";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useMemo, type ReactNode } from "react";

export default function StreamButton(props: {
   children?: ReactNode;
   className?: string;
   voiceState: GatewayVoiceStateFlags;
   videoSource?: MediaSource;
   onOpenScreenShare?: () => void;
   onOpenAudioStream?: () => void;
   onCloseStream?: () => void;
   onChangeStream?: () => void;
   onUpdateStream?: (video?: { quality?: ScreenShareQuality; frameRate?: ScreenShareFrameRate }) => void;
   onOpenChanged?: (isOpen: boolean) => void;
   hideArrow?: boolean;
   anchor?: DropdownAnchor;
}) {
   const isStreaming = useMemo(() => props.voiceState.isScreenSharing || props.voiceState.isAudioStreaming, [props.voiceState]);
   const huginnWindow = useHuginnWindow();

   const videoSettings = useMemo(() => props.videoSource?.trackSettings, [props.videoSource]);

   return isStreaming ? (
      <DropdownMenu anchor={props.anchor} onOpenChanged={props.onOpenChanged} className={clsx("flex", props.className)}>
         {props.children}
         {!props.hideArrow && (
            <DropdownMenu.Button className="bg-primary-800 hover:bg-primary-600 ml-0.5 flex h-full items-center justify-center rounded-r-lg px-1 transition-colors">
               {({ open }: { open: boolean }) =>
                  open ? <IconMingcuteUpFill className="text-text size-4" /> : <IconMingcuteDownFill className="text-text size-4" />
               }
            </DropdownMenu.Button>
         )}
         <DropdownMenu.Items className="border-surface border">
            <DropdownMenu.Item color="negative" label="End Stream" onClick={props.onCloseStream} />
            <DropdownMenu.Item label="Change Stream" onClick={props.onChangeStream}>
               <IconMingcuteTransfer3Fill />
            </DropdownMenu.Item>
            <DropdownMenu>
               <DropdownMenu.Item label="Resolution" isNested>
                  <span className="text-white/60">{videoSettings?.height ? `${videoSettings.height}p` : "Unknown"}</span>
               </DropdownMenu.Item>
               <DropdownMenu.Items>
                  {screenShareQualities.map((x) => (
                     <DropdownMenu.Item key={x.value} label={`${x.height}p`} onClick={() => props.onUpdateStream?.({ quality: x.value })}>
                        {videoSettings?.height === x.height && <IconMingcuteCheckFill className="text-positive-300" />}
                     </DropdownMenu.Item>
                  ))}
               </DropdownMenu.Items>
            </DropdownMenu>
            <DropdownMenu>
               <DropdownMenu.Item label="Frame Rate" isNested>
                  <span className="text-white/60">{videoSettings?.frameRate ? `${videoSettings.frameRate} fps` : "Unknown"}</span>
               </DropdownMenu.Item>
               <DropdownMenu.Items>
                  {screenShareFrameRates.map((x) => (
                     <DropdownMenu.Item key={x} label={`${x} fps`} onClick={() => props.onUpdateStream?.({ frameRate: x })}>
                        {videoSettings?.frameRate === x && <IconMingcuteCheckFill className="text-positive-300" />}
                     </DropdownMenu.Item>
                  ))}
               </DropdownMenu.Items>
            </DropdownMenu>
         </DropdownMenu.Items>
      </DropdownMenu>
   ) : (
      <DropdownMenu anchor={props.anchor} onOpenChanged={props.onOpenChanged} className={props.className}>
         {props.children}
         <DropdownMenu.Items className="border-surface border">
            <DropdownMenu.Item label="Screen Share" onClick={props.onOpenScreenShare}>
               <IconMingcuteMonitorFill />
            </DropdownMenu.Item>
            <DropdownMenu.Item label="Audio Stream" onClick={props.onOpenAudioStream} disabled={huginnWindow.environment !== "desktop"}>
               <IconMingcuteVolumeFill />
            </DropdownMenu.Item>
         </DropdownMenu.Items>
      </DropdownMenu>
   );
}
