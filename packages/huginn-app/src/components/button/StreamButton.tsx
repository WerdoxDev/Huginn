import type { GatewayVoiceStateFlags } from "@huginn/shared";

import { SCREEN_SHARE_FRAME_RATES, SCREEN_SHARE_QUALITIES } from "@lib/constants";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useMemo, type ReactNode } from "react";

import type { MediaSource, ScreenShareFrameRate, ScreenShareQuality } from "@/types";

import { HuginnMenu } from "../dropdown/HuginnMenu";

export default function StreamButton(props: {
   children?: ReactNode;
   className?: string;
   voiceState: GatewayVoiceStateFlags;
   videoSource?: MediaSource;
   onOpenScreenShare?: () => void;
   onOpenAudioStream?: () => void;
   onCloseStream?: () => void;
   onChangeStream?: () => void;
   onUpdateStream?: (video?: { width?: number; height?: number; frameRate?: number; maxBitrate?: number }) => Promise<void>;
   onOpenChanged?: (isOpen: boolean) => void;
   hideArrow?: boolean;
}) {
   const isStreaming = useMemo(() => props.voiceState.isScreenSharing || props.voiceState.isAudioStreaming, [props.voiceState]);
   const huginnWindow = useHuginnWindow();

   const videoSettings = useMemo(() => props.videoSource?.trackSettings, [props.videoSource]);

   async function handleUpdateStream(video?: { quality?: ScreenShareQuality; frameRate?: ScreenShareFrameRate }) {
      if (video?.quality) {
         const { width, height } = SCREEN_SHARE_QUALITIES.find((x) => x.value === video?.quality)!;
         await props.onUpdateStream?.({ width, height });
      } else if (video?.frameRate) {
         await props.onUpdateStream?.({ frameRate: video.frameRate });
      }
   }

   return isStreaming ? (
      <HuginnMenu onOpenChange={(open: boolean) => props.onOpenChanged?.(open)}>
         <div className={clsx("flex", props.className)}>
            {props.children}
            {!props.hideArrow && (
               <HuginnMenu.Trigger
                  className="bg-primary-800 hover:bg-primary-600 ml-0.5 flex h-full items-center justify-center rounded-r-lg px-1 transition-colors"
                  render={(props, state) => (
                     <button {...props}>
                        {state.open ? <IconMingcuteUpFill className="text-text size-4" /> : <IconMingcuteDownFill className="text-text size-4" />}
                     </button>
                  )}
               />
            )}
         </div>
         <HuginnMenu.Content sideOffset={8} className="border-surface border">
            <HuginnMenu.Item label="End Stream" color="negative" onClick={props.onCloseStream} />
            <HuginnMenu.Item label="Change Stream" onClick={props.onChangeStream} endSlot={<IconMingcuteTransfer3Fill />} />
            <HuginnMenu.Submenu
               label="Resolution"
               endSlot={<span className="text-white/60">{videoSettings?.height ? `${videoSettings.height}p` : "Unknown"}</span>}
            >
               {SCREEN_SHARE_QUALITIES.map((x) => (
                  <HuginnMenu.Item
                     key={x.value}
                     label={`${x.height}p`}
                     onClick={() => handleUpdateStream({ quality: x.value })}
                     endSlot={videoSettings?.height === x.height ? <IconMingcuteCheckFill className="text-positive-300" /> : undefined}
                  />
               ))}
            </HuginnMenu.Submenu>
            <HuginnMenu.Submenu
               label="Frame Rate"
               endSlot={<span className="text-white/60">{videoSettings?.frameRate ? `${videoSettings.frameRate} fps` : "Unknown"}</span>}
            >
               {SCREEN_SHARE_FRAME_RATES.map((x) => (
                  <HuginnMenu.Item
                     key={x}
                     label={`${x} fps`}
                     onClick={() => props.onUpdateStream?.({ frameRate: x })}
                     endSlot={videoSettings?.frameRate === x ? <IconMingcuteCheckFill className="text-positive-300" /> : undefined}
                  />
               ))}
            </HuginnMenu.Submenu>
         </HuginnMenu.Content>
      </HuginnMenu>
   ) : (
      <HuginnMenu onOpenChange={(open: boolean) => props.onOpenChanged?.(open)}>
         <div className={clsx("flex", props.className)}>
            <HuginnMenu.Trigger asChild>
               <div className="flex w-full">{props.children}</div>
            </HuginnMenu.Trigger>
         </div>
         <HuginnMenu.Content sideOffset={8} className="border-surface border">
            <HuginnMenu.Item label="Screen Share" onClick={props.onOpenScreenShare} endSlot={<IconMingcuteMonitorFill />} />
            <HuginnMenu.Item
               label="Audio Stream"
               onClick={props.onOpenAudioStream}
               disabled={huginnWindow.environment !== "desktop"}
               endSlot={<IconMingcuteVolumeFill />}
            />
         </HuginnMenu.Content>
      </HuginnMenu>
   );
}
