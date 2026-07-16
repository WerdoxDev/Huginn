import type { ImageSize, Snowflake } from "@huginn/shared";

import { useAnimatedImage } from "@hooks/useAnimatedImage";
import { PRESENCE_STATUS_MAP } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { usePresence } from "@stores/presenceStore";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import type { AnimatedMode } from "@/types";

import LoadingBackground from "./LoadingBackground";

export default function UserAvatar(props: {
   userId: Snowflake;
   avatarHash?: string | null;
   imageSrc?: string | null;
   size?: number;
   cdnSize?: ImageSize;
   className?: string;
   hideStatus?: boolean;
   animatedMode?: AnimatedMode;
   hovered?: boolean;
   test?: boolean;
   maskImage?: string;
}) {
   const client = useClient();
   const imgRef = useRef<HTMLImageElement>(null);

   const presence = usePresence(props.userId);
   const [hasError, setHasError] = useState(false);
   const [isLoaded, setIsLoaded] = useState(false);

   const { src, hoverHandlers } = useAnimatedImage({
      id: props.userId,
      hash: props.avatarHash,
      imageSrc: props.imageSrc,
      cdnSize: props.cdnSize,
      animatedMode: props.animatedMode,
      hovered: props.hovered,
      normalUrl: props.avatarHash ? client?.cdn.avatar(props.userId, props.avatarHash) : undefined,
      staticUrl: props.avatarHash
         ? client?.cdn.avatar(props.userId, props.avatarHash, { format: "webp", size: props.cdnSize ?? 64, forceStatic: true })
         : undefined,
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
   }, [props.avatarHash, props.imageSrc, props.userId, client]);

   const { size = 2.25, className } = props;
   const hasImage = !!src;
   const statusSize = size / 4;
   const statusCenter = statusSize / 2;
   const cutoutRadius = statusCenter + size / 18;

   // Radial gradient mask that punches a transparent hole where the status indicator sits
   const maskGradient = `radial-gradient(circle ${cutoutRadius}rem at calc(100% - ${statusCenter}rem) calc(100% - ${statusCenter}rem), transparent calc(100% - 1px), black 100%)`;
   const maskStyle = !props.hideStatus ? { maskImage: maskGradient, WebkitMaskImage: maskGradient } : undefined;

   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: `${size}rem`, height: `${size}rem` }} {...hoverHandlers}>
         <div
            className="relative h-full w-full overflow-hidden rounded-full"
            style={props.maskImage ? { maskImage: props.maskImage } : presence && presence.status !== "offline" ? maskStyle : undefined}
         >
            <LoadingBackground hasError={hasError} isLoaded={isLoaded || !hasImage} />
            {hasImage ? (
               <img
                  ref={imgRef}
                  onLoad={handleLoad}
                  onError={handleError}
                  alt="user-avatar"
                  src={src}
                  loading="lazy"
                  className="h-full w-full object-cover"
               />
            ) : (
               !hasError && <div className="bg-primary-700 h-full w-full" />
            )}
         </div>
         {!props.hideStatus && (
            <div
               className={clsx(
                  "absolute right-0 bottom-0 rounded-full",
                  presence?.status && presence.status !== "offline" ? PRESENCE_STATUS_MAP[presence.status].color : "bg-transparent",
               )}
               style={{ width: `${statusSize}rem`, height: `${statusSize}rem` }}
            />
         )}
      </div>
   );
}
