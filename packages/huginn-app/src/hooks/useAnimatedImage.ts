import type { ImageSize, Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useMemo, useState } from "react";

import type { AnimatedMode } from "@/types";

export function useAnimatedImage(options: {
   id: Snowflake;
   hash?: string | null;
   staticUrl?: string;
   normalUrl?: string;
   imageSrc?: string | null;
   cdnSize?: ImageSize;
   animatedMode?: AnimatedMode;
   hovered?: boolean;
}) {
   const client = useClient();
   const [isHovered, setIsHovered] = useState(false);
   const huginnWindow = useHuginnWindow();

   const animatedMode = options.animatedMode ?? "hover";
   const isAnimatedAvatar = options.hash?.startsWith("a_");
   const isHoverControlled = options.hovered !== undefined;
   const hoverActive = isHoverControlled ? options.hovered : isHovered;

   const src = useMemo(() => {
      if (options.imageSrc !== undefined) return options.imageSrc ?? undefined;
      if (!options.hash || !client) return undefined;

      // const staticUrl = client.cdn.avatar(props.id, props.hash, { format: "webp", size: props.cdnSize ?? 64, forceStatic: true });
      // const animatedUrl = client.cdn.avatar(props.id, props.hash);
      if (!huginnWindow.focused) return options.staticUrl;

      if (isAnimatedAvatar) {
         if (animatedMode === "always") return options.normalUrl;
         if (animatedMode === "hover") return hoverActive ? options.normalUrl : options.staticUrl;
         return options.staticUrl;
      }

      return options.staticUrl;
   }, [
      options.imageSrc,
      options.hash,
      options.id,
      options.cdnSize,
      client,
      isAnimatedAvatar,
      animatedMode,
      hoverActive,
      options.staticUrl,
      options.normalUrl,
   ]);

   // Only attach hover handlers when the component itself should manage hover state
   // (i.e. animated hover mode and hover is not controlled externally)
   const shouldHandleHover = animatedMode === "hover" && isAnimatedAvatar && !isHoverControlled;

   const hoverHandlers = shouldHandleHover
      ? {
           onMouseEnter: () => setIsHovered(true),
           onMouseLeave: () => setIsHovered(false),
        }
      : undefined;

   return { src, hoverHandlers };
}
