import { useFavoriteGifs } from "@hooks/useFavoriteGifs";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { clsx } from "clsx";
import { useEffect, useRef, type MouseEvent } from "react";

import Tooltip from "./tooltip/Tooltip";

export default function GifPlayer(props: {
   src: string;
   url: string;
   width: number;
   height: number;
   originalWidth: number;
   originalHeight: number;
   onContextMenu?: (event: MouseEvent<HTMLVideoElement>) => void;
}) {
   const { updateModals } = useModals();
   const { favoriteGifs, addFavorite, removeFavorite } = useFavoriteGifs();
   const aspectRatio = props.width && props.height ? props.width / props.height : 1;
   const isFavorite = favoriteGifs?.some((gif) => gif.url === props.url) ?? false;
   const huginnWindow = useHuginnWindow();
   const videoRef = useRef<HTMLVideoElement>(null);

   useEffect(() => {
      if (huginnWindow.focused) videoRef.current?.play();
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
         },
      });
   }

   async function handleFavoriteClick(e: MouseEvent<HTMLButtonElement>) {
      e.stopPropagation();
      if (isFavorite) {
         await removeFavorite(props.url);
         return;
      }

      await addFavorite({
         url: props.url,
         src: props.src,
         width: props.originalWidth,
         height: props.originalHeight,
         timestamp: Date.now(),
      });
   }

   return (
      <div
         style={{ width: `100%`, maxWidth: `${props.width}px`, height: `100%`, aspectRatio }}
         className="relative overflow-hidden rounded-md select-none"
      >
         <video
            className="h-full w-full cursor-pointer"
            ref={videoRef}
            src={props.src}
            onContextMenu={props.onContextMenu}
            autoPlay={huginnWindow.focused}
            muted
            loop
            onClick={handleClick}
         />
         <div className="absolute top-2 left-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            GIF
         </div>
         <Tooltip>
            <Tooltip.Trigger
               type="button"
               className={clsx(
                  "absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-md bg-black/80 text-white opacity-0 transition-[colors,opacity] group-hover:opacity-100 hover:bg-black",
                  isFavorite && "",
               )}
               onClick={handleFavoriteClick}
            >
               <IconMingcuteStarFill className={clsx("size-5", isFavorite && "text-caution-300")} />
            </Tooltip.Trigger>
            <Tooltip.Content>{isFavorite ? "Remove from GIFs" : "Add to GIFs"}</Tooltip.Content>
         </Tooltip>
      </div>
   );
}
