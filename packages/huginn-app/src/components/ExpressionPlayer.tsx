import { ExpressionType, type ExpressionKind } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useRef, useState, type MouseEvent } from "react";

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
      origin?: "attachment" | "embed";
   } & (
      | { isImage: true; onContextMenu?: (event: MouseEvent<HTMLImageElement>) => void }
      | { isImage?: false; onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void }
   ),
) {
   const { updateModals } = useModals();
   const aspectRatio = props.width && props.height ? props.width / props.height : 1;
   const huginnWindow = useHuginnWindow();
   const videoRef = useRef<HTMLVideoElement>(null);

   // A refreshed signature still points to the same uploaded asset. Keep its
   // playback URL for this mount so acknowledging a message doesn't restart it.
   let assetKey = props.src;
   if (props.media.type === ExpressionType.UPLOADED) {
      const assetUrl = new URL(props.src);
      assetUrl.searchParams.delete("ex");
      assetUrl.searchParams.delete("hm");
      assetKey = assetUrl.href;
   }
   const playbackKey = `${props.kind}:${!!props.isImage}:${assetKey}`;
   const [playback, setPlayback] = useState({ key: playbackKey, src: props.src, hasError: false });
   let playbackSrc = playback.src;
   if (playback.key !== playbackKey || (playback.hasError && playback.src !== props.src)) {
      playbackSrc = props.src;
      setPlayback({ key: playbackKey, src: props.src, hasError: false });
   }

   function handlePlaybackError() {
      // The retained URL may have expired before it finished loading.
      setPlayback({ key: playbackKey, src: props.src, hasError: playbackSrc === props.src });
   }

   useEffect(() => {
      if (huginnWindow.focused) void videoRef.current?.play().catch(() => {});
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
            kind: props.kind === "stickers" ? "sticker" : "gif",
            origin: props.origin,
            provider: props.media.type,
            filename: props.filename,
         },
      });
   }

   return (
      <div
         style={{ width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}
         onErrorCapture={handlePlaybackError}
         onLoadCapture={() => {
            if (playback.hasError) setPlayback({ ...playback, hasError: false });
         }}
         className="group/expression relative overflow-hidden rounded-md select-none"
      >
         {props.isImage ? (
            <ImagePreview
               filename={props.filename}
               url={props.src}
               playbackUrl={playbackSrc}
               width={props.width}
               height={props.height}
               originalWidth={props.originalWidth}
               originalHeight={props.originalHeight}
               contentType={props.contentType ?? "image/gif"}
               kind={props.kind === "stickers" ? "sticker" : "gif"}
               origin={props.origin}
               provider={props.media.type}
               disableQuery={props.disableQuery ?? true}
               onContextMenu={props.onContextMenu}
            />
         ) : (
            <video
               className="h-full w-full cursor-pointer"
               ref={videoRef}
               src={playbackSrc}
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
