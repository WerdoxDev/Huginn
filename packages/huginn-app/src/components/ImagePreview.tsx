import { MessageContext } from "@contexts/MessageProvider";
import { Transition } from "@headlessui/react";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useContext, useEffect, useRef, useState } from "react";

import LoadingIcon from "./LoadingIcon";

export default function ImagePreview(props: {
   url: string;
   width: number;
   height: number;
   originalWidth: number;
   originalHeight: number;
   filename?: string;
   disableQuery?: boolean;
}) {
   const [isLoaded, setIsLoaded] = useState(false);
   const [hasError, setHasError] = useState(false);
   const [useCors, setUseCors] = useState(false);
   const imgRef = useRef<HTMLImageElement>(null);
   const { updateModals } = useModals();
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);

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

   return (
      <>
         <img
            crossOrigin={useCors ? undefined : "anonymous"}
            onContextMenu={(e) => open({ message: context.message, imgRef }, e)}
            onError={onError}
            loading="lazy"
            onLoad={onLoad}
            ref={imgRef}
            src={`${props.url}${!props.disableQuery ? `&${new URLSearchParams({ format: "webp", width: props.width.toString(), height: props.height.toString() }).toString()}` : ""}`}
            alt={props.filename}
            onClick={() =>
               updateModals({
                  magnifiedImage: {
                     isOpen: true,
                     url: props.url,
                     width: props.originalWidth,
                     height: props.originalHeight,
                     filename: props.filename,
                  },
               })
            }
            className={clsx("cursor-pointer overflow-hidden rounded-md object-contain", hasError && "hidden")}
            style={{ width: `${props.width}px`, height: `${props.height}px` }}
         />
         <Transition show={!isLoaded || hasError}>
            <div
               className={clsx(
                  !hasError && "absolute inset-0",
                  "bg-surface/40 flex items-center justify-center rounded-md duration-200 data-closed:opacity-0",
               )}
               style={{ width: `${props.width}px`, height: `${props.height}px` }}
            >
               {!isLoaded && !hasError && <LoadingIcon className="size-16" />}
               {hasError && <IconMingcuteWarningFill className="text-negative-100 size-16" />}
            </div>
         </Transition>
      </>
   );
}
