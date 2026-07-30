import { MessageContext } from "@contexts/MessageProvider";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useContext, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import LoadingBackground from "./LoadingBackground";

export default function ImagePreview(props: {
   url: string;
   width: number;
   height: number;
   originalWidth: number;
   originalHeight: number;
   filename?: string;
   disableQuery?: boolean;
   contentType?: string;
   onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}) {
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const [useCors, setUseCors] = useState(false);
   const imgRef = useRef<HTMLImageElement>(null);
   const { updateModals } = useModals();
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);
   const aspectRatio = props.originalWidth && props.originalHeight ? props.originalWidth / props.originalHeight : 1;
   const huginnWindow = useHuginnWindow();

   const src = useMemo(() => {
      if (props.contentType === "image/gif" && huginnWindow.focused) return props.url;
      return `${props.url}${!props.disableQuery ? `&${new URLSearchParams({ format: "webp", width: props.width.toString(), height: props.height.toString() }).toString()}` : ""}`;
   }, [props.url, props.width, props.height, props.disableQuery, huginnWindow.focused]);

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

   function handleClick(e: React.MouseEvent) {
      e.stopPropagation();
      updateModals({
         magnifiedMedia: {
            isOpen: true,
            url: props.url,
            width: props.originalWidth,
            height: props.originalHeight,
            filename: props.filename,
            type: "image",
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
