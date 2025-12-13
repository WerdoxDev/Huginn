import type { DisplaySource } from "@/types";

export default function DisplayPreview(props: { source: DisplaySource; onSelect: (source: DisplaySource) => void }) {
   return (
      <button
         type="button"
         className="group flex cursor-pointer select-none flex-col gap-y-2"
         draggable={false}
         onClick={() => props.onSelect(props.source)}
      >
         <img
            src={props.source.thumbnail}
            alt={props.source.id}
            className="group-hover:ring-primary-700 aspect-video w-full overflow-hidden rounded-lg bg-black object-contain transition-all group-hover:ring-2"
         />
         <div className="flex items-center gap-x-2">
            {props.source.appIcon ? (
               <img src={props.source.appIcon} alt={props.source.id} className="aspect-square size-5" />
            ) : (
               <IconMingcuteMonitorFill className="text-text size-5" />
            )}
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm text-white">{props.source.name}</div>
         </div>
      </button>
   );
}
