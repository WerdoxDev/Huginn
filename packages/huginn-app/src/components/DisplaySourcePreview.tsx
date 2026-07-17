import { clsx } from "clsx";

import type { DisplaySource } from "@/types";

export default function DisplaySourcePreview(props: {
   source?: DisplaySource;
   deviceInfo?: MediaDeviceInfo;
   onSelect: (source?: DisplaySource, deviceInfo?: MediaDeviceInfo) => void;
}) {
   const isSource = !!props.source;
   const hasThumbnail = !!props.source?.thumbnail;
   const hasIcon = !!props.source?.appIcon;
   const isScreen = !!props.source?.electronId && props.source.electronId.includes("screen");
   const isDevice = !!props.deviceInfo;
   return (
      <button
         type="button"
         className={clsx("group flex flex-col gap-y-2 select-none", isSource && !hasThumbnail ? "cursor-not-allowed" : "cursor-pointer")}
         draggable={false}
         onClick={() => (isSource && !hasThumbnail ? undefined : props.onSelect(props.source, props.deviceInfo))}
      >
         <div className="group-hover:ring-primary-700 bg-surface-deep relative aspect-video w-full overflow-hidden rounded-lg transition-all group-hover:ring-2">
            {props.deviceInfo && <div className="from-primary-500 to-text aspect-video w-full bg-linear-to-r"></div>}

            {props.source &&
               (hasThumbnail ? (
                  <img src={props.source.thumbnail!} alt={props.source.name} className="aspect-video w-full bg-black object-contain" />
               ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                     {isScreen ? "Screen not available" : "App is minimized"}
                  </div>
               ))}

            {((isSource && hasThumbnail) || isDevice) && (
               <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg bg-black/50 opacity-0 transition-all group-hover:opacity-100">
                  <div className="bg-primary-700 rounded-lg px-2 py-1 text-white">{isSource ? "Share screen" : isDevice ? "Share device" : ""}</div>
               </div>
            )}
         </div>
         <div className="flex items-center gap-x-2">
            {hasIcon ? (
               <img src={props.source!.appIcon!} alt={props.source!.name} className="aspect-square size-5" />
            ) : props.source ? (
               props.source.electronId.includes("screen") ? (
                  <IconMingcuteMonitorFill className="text-text size-5" />
               ) : (
                  <IconMingcuteWebFill className="text-text size-5" />
               )
            ) : (
               <IconMingcuteVideoCamera2Fill className="text-text size-5" />
            )}
            <div className="-mb-1 truncate pb-1 text-center text-sm text-white">{props.source?.name ?? props.deviceInfo?.label}</div>
         </div>
      </button>
   );
}
