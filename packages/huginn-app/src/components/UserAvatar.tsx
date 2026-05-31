import type { ImageSize, Snowflake } from "@huginn/shared";

import { useAnimatedImage } from "@hooks/useAnimatedImage";
import { PRESENCE_STATUS_MAP } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { usePresence } from "@stores/presenceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import type { AnimatedMode } from "@/types";

import LoadingIcon from "./LoadingIcon";

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
}) {
   const client = useClient();
   const imgRef = useRef<HTMLImageElement>(null);
   const huginnWindow = useHuginnWindow();

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

   // const [isHovered, setIsHovered] = useState(false);
   // const isAnimatedAvatar = props.avatarHash?.startsWith("a_");
   // const animatedMode = props.animatedMode ?? "hover";
   // const isHoverControlled = props.hovered !== undefined;
   // const hoverActive = isHoverControlled ? props.hovered : isHovered;

   // const src = useMemo(() => {
   //    if (props.imageSrc !== undefined) {
   //       return props.imageSrc || undefined;
   //    }

   //    if (!props.avatarHash || !client) return undefined;

   //    const modifiedUrl = client.cdn.avatar(props.userId, props.avatarHash, { format: "webp", size: props.cdnSize ?? 64, forceStatic: true });
   //    const baseUrl = client.cdn.avatar(props.userId, props.avatarHash);

   //    if (isAnimatedAvatar) {
   //       if (animatedMode === "always") return client.cdn.avatar(props.userId, props.avatarHash);
   //       if (animatedMode === "hover") {
   //          return hoverActive ? baseUrl : modifiedUrl;
   //       }

   //       return modifiedUrl;
   //    }

   //    return modifiedUrl;
   // }, [props.imageSrc, props.avatarHash, props.userId, props.cdnSize, client, isAnimatedAvatar, animatedMode, hoverActive]);

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

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      if (props.avatarHash && client) {
         window.electronAPI.saveImageToCache(client.cdn.avatar(props.userId, props.avatarHash, { size: 256, format: "png" }), props.avatarHash);
      }
   }, [props.avatarHash, props.imageSrc, props.userId, client, huginnWindow.environment]);

   const { size = 2.25, className } = props;
   const hasImage = !!src;
   const statusSize = size / 4;
   const statusCenter = statusSize / 2;
   const cutoutRadius = statusCenter + size / 18;

   // Radial gradient mask that punches a transparent hole where the status indicator sits
   const maskGradient = `radial-gradient(circle ${cutoutRadius}rem at calc(100% - ${statusCenter}rem) calc(100% - ${statusCenter}rem), transparent 100%, black 100%)`;
   const maskStyle = !props.hideStatus ? { maskImage: maskGradient, WebkitMaskImage: maskGradient } : undefined;

   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: `${size}rem`, height: `${size}rem` }} {...hoverHandlers}>
         <div className="relative h-full w-full" style={presence && presence.status !== "offline" ? maskStyle : undefined}>
            {!isLoaded && hasImage && (
               <div className="bg-primary-900 absolute inset-0 flex items-center justify-center rounded-full">
                  <LoadingIcon className="size-5" />
               </div>
            )}
            {hasImage ? (
               <img
                  ref={imgRef}
                  onLoad={onLoad}
                  onError={onError}
                  alt="user-avatar"
                  src={src}
                  loading="lazy"
                  className="h-full w-full rounded-full object-cover"
               />
            ) : hasError ? (
               <div className="bg-negative-400 text-text flex h-full w-full items-center justify-center rounded-full font-bold">!</div>
            ) : (
               <div className="bg-primary-700 h-full w-full rounded-full" />
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
