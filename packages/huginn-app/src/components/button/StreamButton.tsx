import DropdownMenu from "@components/dropdown/DowndownMenu";
import { type MenuItemsProps } from "@headlessui/react";
import type { GatewayVoiceStateFlags } from "@huginn/shared";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useMemo, type ReactNode } from "react";

export default function StreamButton(props: {
   children?: ReactNode;
   className?: string;
   voiceState: GatewayVoiceStateFlags;
   onStartScreenShare?: () => void;
   onStartAudioStream?: () => void;
   onEndStream?: () => void;
   onChangeStream?: () => void;
   onOpenChanged?: (isOpen: boolean) => void;
   hideArrow?: boolean;
   anchor?: MenuItemsProps["anchor"];
}) {
   const isStreaming = useMemo(() => props.voiceState.isStreaming, [props.voiceState]);
   const huginnWindow = useHuginnWindow();

   return isStreaming ? (
      <DropdownMenu onOpenChanged={props.onOpenChanged} className={clsx("flex", props.className)}>
         {props.children}
         {!props.hideArrow && (
            <DropdownMenu.Button className="bg-primary-800 hover:bg-primary-600 ml-0.5 flex h-full items-center justify-center rounded-r-lg px-1 transition-colors">
               {({ open }: { open: boolean }) =>
                  open ? <IconMingcuteUpFill className="text-text size-4" /> : <IconMingcuteDownFill className="text-text size-4" />
               }
            </DropdownMenu.Button>
         )}
         <DropdownMenu.Items anchor={props.anchor ?? "top"} className="border-surface border">
            <DropdownMenu.Item color="negative" label="End Stream" onClick={props.onEndStream} />
            <DropdownMenu.Item label="Change Stream" onClick={props.onChangeStream}>
               <IconMingcuteTransfer3Fill />
            </DropdownMenu.Item>
         </DropdownMenu.Items>
      </DropdownMenu>
   ) : (
      <DropdownMenu onOpenChanged={props.onOpenChanged} className={props.className}>
         {props.children}
         <DropdownMenu.Items anchor={props.anchor ?? "top"} className="border-surface border">
            <DropdownMenu.Item label="Screen Share" onClick={props.onStartScreenShare}>
               <IconMingcuteMonitorFill />
            </DropdownMenu.Item>
            <DropdownMenu.Item label="Audio Stream" onClick={props.onStartAudioStream} disabled={huginnWindow.environment !== "desktop"}>
               <IconMingcuteVolumeFill />
            </DropdownMenu.Item>
         </DropdownMenu.Items>
      </DropdownMenu>
   );
}
