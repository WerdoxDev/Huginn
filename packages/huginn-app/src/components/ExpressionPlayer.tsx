import type { ExpressionKind } from "@huginnjs/shared";

import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useRef, type MouseEvent } from "react";

import type { AppExpression } from "@/types";

import ExpressionSaveButton from "./ExpressionSaveButton";
import ImagePreview from "./ImagePreview";

export default function ExpressionPlayer(
   props: {
      kind: ExpressionKind;
      showSaveButton?: boolean;
      contentType?: string;
      src: string;
      width: number;
      height: number;
      originalWidth: number;
      originalHeight: number;
      media: Partial<AppExpression>;
      filename?: string;
      disableQuery?: boolean;
   } & (
      | { isImage: true; onContextMenu?: (event: MouseEvent<HTMLImageElement>) => void }
      | { isImage?: false; onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void }
   ),
) {
   const { updateModals } = useModals();
   const aspectRatio = props.width && props.height ? props.width / props.height : 1;
   const huginnWindow = useHuginnWindow();
   const videoRef = useRef<HTMLVideoElement>(null);

   useEffect(() => {
      if (huginnWindow.focused) videoRef.current?.play();
      else videoRef.current?.pause();
   }, [huginnWindow.focused]);

   function handleClick(e: MouseEvent) {
      e.stopPropagation();
      updateModals({
         magnifiedMedia: {
            isOpen: true,
            url: props.src,
            width: props.originalWidth,
            height: props.originalHeight,
            type: "video",
         },
      });
   }

   return (
      <div
         style={{ width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}
         className="group relative overflow-hidden rounded-md select-none"
      >
         {props.isImage ? (
            <ImagePreview
               filename={props.filename}
               url={props.src}
               width={props.width}
               height={props.height}
               originalWidth={props.originalWidth}
               originalHeight={props.originalHeight}
               contentType={props.contentType ?? "image/gif"}
               disableQuery={props.disableQuery ?? true}
               onContextMenu={props.onContextMenu}
            />
         ) : (
            <video
               className="h-full w-full cursor-pointer"
               ref={videoRef}
               src={props.src}
               onContextMenu={props.onContextMenu}
               autoPlay={huginnWindow.focused}
               muted
               playsInline
               loop
               onClick={handleClick}
            />
         )}
         {props.kind !== "stickers" && (
            <div className="absolute top-2 left-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
               GIF
            </div>
         )}
         {props.showSaveButton !== false && <ExpressionSaveButton kind={props.kind} media={props.media} />}
      </div>
   );
}
