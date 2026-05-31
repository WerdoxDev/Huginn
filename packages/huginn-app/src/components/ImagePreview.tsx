import { MessageContext } from "@contexts/MessageProvider";
import { Transition } from "@headlessui/react";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import LoadingBackground from "./LoadingBackground";
import LoadingIcon from "./LoadingIcon";

export default function ImagePreview(props: {
   url: string;
   width: number;
   height: number;
   originalWidth: number;
   originalHeight: number;
   filename?: string;
   disableQuery?: boolean;
   contentType?: string;
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

   function onLoad() {
      setIsLoaded(true);
      setHasError(false);
   }

   function onError() {
      setHasError(true);
      setUseCors(true);
   }

   function onClick(e: React.MouseEvent) {
      e.stopPropagation();
      updateModals({
         magnifiedImage: {
            isOpen: true,
            url: props.url,
            width: props.originalWidth,
            height: props.originalHeight,
            filename: props.filename,
         },
      });
   }

   return (
      <div className="relative overflow-hidden rounded-md" style={{ width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}>
         <img
            crossOrigin={useCors ? undefined : "anonymous"}
            onContextMenu={(e) => open({ message: context.message, imgRef }, e)}
            onError={onError}
            loading="lazy"
            onLoad={onLoad}
            ref={imgRef}
            src={src}
            alt={props.filename}
            onClick={onClick}
            className={clsx("h-full w-full cursor-pointer overflow-hidden object-contain", hasError && "hidden")}
         />
         <LoadingBackground hasError={hasError} isLoaded={isLoaded} />
      </div>
   );
}
