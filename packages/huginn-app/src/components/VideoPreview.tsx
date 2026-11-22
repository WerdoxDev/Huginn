import type { MouseEvent } from "react";

import { formatSeconds } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";

export default function VideoPreview(props: {
   url: string;
   poster?: string;
   width: number;
   height: number;
   originalWidth: number;
   originalHeight: number;
   filename?: string;
   duration?: number;
   origin: "attachment" | "embed";
   onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void;
}) {
   const { updateModals } = useModals();

   function open(event: MouseEvent) {
      event.stopPropagation();
      updateModals({
         magnifiedMedia: {
            isOpen: true,
            kind: "video",
            type: "video",
            origin: props.origin,
            url: props.url,
            filename: props.filename,
            width: props.originalWidth || 640,
            height: props.originalHeight || 360,
         },
      });
   }

   return (
      <button
         type="button"
         aria-label="Open video"
         className="relative block w-full cursor-pointer overflow-hidden rounded-md"
         style={{ maxWidth: props.width || 640, aspectRatio: props.width && props.height ? props.width / props.height : 16 / 9 }}
         onClick={open}
      >
         <video
            src={props.url}
            poster={props.poster}
            preload="metadata"
            playsInline
            muted
            className="h-full w-full object-contain"
            onContextMenu={props.onContextMenu}
         />
         <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <IconMingcutePlayFill className="size-12 rounded-full bg-black/50 p-2 text-white" />
         </div>
         <div className="absolute right-2 bottom-2 rounded-md bg-black/50 px-2 py-1 text-sm text-white">
            {props.duration ? formatSeconds(props.duration) : "0:00"}
         </div>
      </button>
   );
}
