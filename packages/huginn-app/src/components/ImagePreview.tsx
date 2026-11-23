import { captureMediaViewerSource } from "@lib/media-viewer-source";
import type { ExpressionType } from "@huginnjs/shared";

import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import LoadingBackground from "./LoadingBackground";

export default function ImagePreview(props: {
   url: string;
   playbackUrl?: string;
   width: number;
   height: number;
   originalWidth: number;
   originalHeight: number;
   filename?: string;
   disableQuery?: boolean;
   contentType?: string;
   kind?: "image" | "gif" | "sticker";
   origin?: "attachment" | "embed";
   provider?: ExpressionType;
   onContextMenu?: (event: MouseEvent<HTMLImageElement>) => void;
}) {
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const [useCors, setUseCors] = useState(false);
   const imgRef = useRef<HTMLImageElement>(null);
   const { updateModals } = useModals();
   const aspectRatio = props.originalWidth && props.originalHeight ? props.originalWidth / props.originalHeight : 1;
   const huginnWindow = useHuginnWindow();

   const src = useMemo(() => {
      const url = props.playbackUrl ?? props.url;
      if (props.contentType === "image/gif" && huginnWindow.focused) return url;
      return `${url}${!props.disableQuery ? `&${new URLSearchParams({ format: "webp", width: props.width.toString(), height: props.height.toString() }).toString()}` : ""}`;
   }, [props.url, props.playbackUrl, props.width, props.height, props.disableQuery, props.contentType, huginnWindow.focused]);

   useEffect(() => {
      if (imgRef.current?.complete) {
         setIsLoaded(true);
      }
   }, []);

   function handleLoad() {
      setIsLoaded(true);
      setHasError(false);
   }

   function handleError() {
      setHasError(true);
      setUseCors(true);
   }

   function handleClick(e: MouseEvent<HTMLImageElement>) {
      e.stopPropagation();
      updateModals({
         magnifiedMedia: {
            source: captureMediaViewerSource(e.currentTarget),
            isOpen: true,
            url: props.url,
            width: props.originalWidth,
            height: props.originalHeight,
            filename: props.filename,
            type: "image",
            kind: props.kind ?? (props.contentType === "image/gif" ? "gif" : "image"),
            origin: props.origin,
            provider: props.provider,
         },
      });
   }

   return (
      <div className="relative overflow-hidden rounded-md" style={{ width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}>
         <img
            crossOrigin={useCors ? undefined : "anonymous"}
            onContextMenu={props.onContextMenu}
            onError={handleError}
            loading="lazy"
            onLoad={handleLoad}
            ref={imgRef}
            src={src}
            alt={props.filename}
            onClick={handleClick}
            className={clsx("h-full w-full cursor-pointer overflow-hidden object-contain", hasError && "hidden")}
         />
         <LoadingBackground hasError={hasError} isLoaded={isLoaded} />
      </div>
   );
}
