import type { Snowflake } from "@huginnjs/shared";

import { useAnimatedImage } from "@hooks/useAnimatedImage";
import { useClient } from "@stores/clientStore";
import { useEffect, useRef, useState } from "react";

import type { AnimatedMode } from "@/types";

import LoadingBackground from "./LoadingBackground";

export default function UserBanner(props: {
   userId: Snowflake;
   bannerHash?: string | null;
   bannerColor?: string | null;
   imageSrc?: string | null;
   className?: string;
   animatedMode?: AnimatedMode;
   hovered?: boolean;
}) {
   const client = useClient();

   const imgRef = useRef<HTMLImageElement>(null);
   const [hasError, setHasError] = useState(false);
   const [isLoaded, setIsLoaded] = useState(false);

   const { src, hoverHandlers } = useAnimatedImage({
      id: props.userId,
      hash: props.bannerHash,
      imageSrc: props.imageSrc,
      animatedMode: props.animatedMode,
      hovered: props.hovered,
      normalUrl: props.bannerHash ? client?.cdn.banner(props.userId, props.bannerHash) : undefined,
      staticUrl: props.bannerHash ? client?.cdn.banner(props.userId, props.bannerHash, { format: "webp", forceStatic: true }) : undefined,
   });

   function handleLoad() {
      setIsLoaded(true);
      setHasError(false);
   }

   function handleError() {
      setHasError(true);
   }

   useEffect(() => {
      setHasError(false);

      if (imgRef.current?.complete) {
         setIsLoaded(true);
      } else {
         setIsLoaded(false);
      }
   }, [props.bannerHash, props.imageSrc, props.userId, client]);

   const hasImage = !!src;

   return (
      <div className="relative h-full w-full shrink-0" {...hoverHandlers}>
         <LoadingBackground hasError={hasError} isLoaded={isLoaded || !hasImage} />
         {hasImage ? (
            <img
               ref={imgRef}
               onLoad={handleLoad}
               onError={handleError}
               alt="user-banner"
               src={src}
               loading="lazy"
               className="h-full w-full object-cover"
            />
         ) : (
            !hasError && <div className="h-full w-full" style={{ backgroundColor: props.bannerColor || "transparent" }} />
         )}
      </div>
   );
}
