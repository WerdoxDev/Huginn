import { clsx } from "clsx";

import type { DisplaySource } from "@/types";

export default function DisplayPreview(props: {
   source?: DisplaySource;
   deviceInfo?: MediaDeviceInfo;
   onSelect: (source?: DisplaySource, deviceInfo?: MediaDeviceInfo) => void;
}) {
   const isSource = !!props.source;
   const hasThumbnail = !!props.source?.thumbnail;
   return (
      <button
         type="button"
         className={clsx("group flex flex-col gap-y-2 select-none", isSource && !hasThumbnail ? "cursor-not-allowed" : "cursor-pointer")}
         draggable={false}
         onClick={() => (isSource && !hasThumbnail ? undefined : props.onSelect(props.source, props.deviceInfo))}
      >
         {props.source && (
            <div className="group-hover:ring-primary-700 bg-surface-deep relative aspect-video w-full overflow-hidden rounded-lg transition-all group-hover:ring-2">
               {hasThumbnail ? (
                  <img src={props.source.thumbnail} alt={props.source.name} className="aspect-video w-full bg-black object-contain" />
               ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">App is minimized</div>
               )}
            </div>
         )}
         {props.deviceInfo && (
            <div className="from-primary-500 to-text group-hover:ring-primary-700 aspect-video w-full rounded-lg bg-linear-to-r transition-all group-hover:ring-2"></div>
         )}
         <div className="flex items-center gap-x-2">
            {props.source?.appIcon ? (
               <img src={props.source.appIcon} alt={props.source.name} className="aspect-square size-5" />
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
