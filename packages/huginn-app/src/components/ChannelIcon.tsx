import type { ImageSize, Snowflake } from "@huginnjs/shared";

import { useAnimatedImage } from "@hooks/useAnimatedImage";
import { useClient } from "@stores/clientStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AnimatedMode } from "@/types";

import LoadingIcon from "./LoadingIcon";

export default function ChannelIcon(props: {
   channelId: Snowflake;
   innerClassName?: string;
   iconHash?: string | null;
   size?: number;
   className?: string;
   cdnSize?: ImageSize;
   animatedMode?: AnimatedMode;
   hovered?: boolean;
}) {
   const client = useClient();
   const imgRef = useRef<HTMLImageElement>(null);

   const [hasError, setHasError] = useState(true);
   const [isLoaded, setIsLoaded] = useState(false);

   const { src, hoverHandlers } = useAnimatedImage({
      id: props.channelId,
      hash: props.iconHash,
      cdnSize: props.cdnSize,
      animatedMode: props.animatedMode,
      hovered: props.hovered,
      normalUrl: props.iconHash ? client?.cdn.channelIcon(props.channelId, props.iconHash) : undefined,
      staticUrl: props.iconHash
         ? client?.cdn.channelIcon(props.channelId, props.iconHash, { format: "webp", size: props.cdnSize ?? 64, forceStatic: true })
         : undefined,
   });

   function onLoad() {
      setIsLoaded(true);
      setHasError(false);
   }

   function onError() {
      setHasError(true);
   }

   useEffect(() => {
      setHasError(false);

      if (imgRef.current?.complete) {
         setIsLoaded(true);
      } else {
         setIsLoaded(false);
      }
   }, [props.iconHash]);

   const hasImage = !!src;

   const { size = 2.25, className } = props;
   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: `${size}rem`, height: `${size}rem` }} {...hoverHandlers}>
         {!isLoaded && hasImage && (
            <div className="bg-primary-900 absolute inset-0 flex items-center justify-center rounded-full">
               <LoadingIcon className="size-5" />
            </div>
         )}
         {hasImage ? (
            <img
               alt="channel-icon"
               src={src}
               onError={onError}
               onLoad={onLoad}
               ref={imgRef}
               loading="lazy"
               className={clsx("h-full w-full rounded-full object-cover", props.innerClassName)}
            />
         ) : hasError ? (
            <div className="bg-negative-500 text-text flex h-full w-full items-center justify-center rounded-full font-bold">!</div>
         ) : (
            <div className="bg-primary-700 h-full w-full rounded-full" />
         )}
      </div>
   );
}
