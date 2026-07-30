import { clsx } from "clsx";

import type { AudioSource } from "@/types";

export default function AudioSourcePreview(props: { source: AudioSource; onSelect: (source: AudioSource) => void }) {
   return (
      <button
         type="button"
         onClick={() => props.onSelect(props.source)}
         className={clsx(
            "bg-surface-alt ring-primary-700 group relative flex cursor-pointer flex-col items-center justify-center gap-y-3 rounded-lg px-4 py-6 text-center transition-shadow hover:ring-2",
         )}
      >
         {props.source?.appIcon ? <img src={props.source.appIcon} className="size-10" /> : <IconMingcuteVolumeFill className="text-text size-10" />}
         <div className="text-text w-full truncate text-sm wrap-anywhere">{props.source?.name}</div>

         <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg bg-black/50 opacity-0 transition-all group-hover:opacity-100">
            <div className="bg-primary-700 rounded-lg px-2 py-1 text-white">Share audio</div>
         </div>
      </button>
   );
}
