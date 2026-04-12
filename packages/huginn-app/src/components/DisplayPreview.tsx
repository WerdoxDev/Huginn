import type { DisplaySource } from "@/types";

export default function DisplayPreview(props: {
   source?: DisplaySource;
   deviceInfo?: MediaDeviceInfo;
   onSelect: (source?: DisplaySource, deviceInfo?: MediaDeviceInfo) => void;
}) {
   return (
      <button
         type="button"
         className="group flex cursor-pointer flex-col gap-y-2 select-none"
         draggable={false}
         onClick={() => props.onSelect(props.source, props.deviceInfo)}
      >
         {props.source && (
            <img
               src={props.source.thumbnail}
               alt={props.source.id}
               className="group-hover:ring-primary-700 aspect-video w-full overflow-hidden rounded-lg bg-black object-contain transition-all group-hover:ring-2"
            />
         )}
         {props.deviceInfo && (
            <div className="from-primary-500 to-text group-hover:ring-primary-700 aspect-video w-full rounded-lg bg-linear-to-r transition-all group-hover:ring-2"></div>
         )}
         <div className="flex items-center gap-x-2">
            {props.source?.appIcon ? (
               <img src={props.source.appIcon} alt={props.source.id} className="aspect-square size-5" />
            ) : props.source ? (
               <IconMingcuteMonitorFill className="text-text size-5" />
            ) : (
               <IconMingcuteVideoCamera2Fill className="text-text size-5" />
            )}
            <div className="-mb-1 truncate pb-1 text-center text-sm text-white">{props.source?.name ?? props.deviceInfo?.label}</div>
         </div>
      </button>
   );
}
