import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useRef } from "react";

export default function GifPlayer(props: { url: string; width: number; height: number; originalWidth: number; originalHeight: number }) {
   const { updateModals } = useModals();
   const aspectRatio = props.width && props.height ? props.width / props.height : 1;
   const huginnWindow = useHuginnWindow();
   const videoRef = useRef<HTMLVideoElement>(null);

   useEffect(() => {
      if (huginnWindow.focused) videoRef.current?.play();
      else videoRef.current?.pause();
   }, [huginnWindow.focused]);

   function handleClick(e: React.MouseEvent) {
      e.stopPropagation();
      updateModals({
         magnifiedMedia: {
            isOpen: true,
            url: props.url,
            width: props.originalWidth,
            height: props.originalHeight,
            type: "video",
         },
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
            src={props.url}
            autoPlay={huginnWindow.focused}
            muted
            loop
            onClick={handleClick}
         />
         <div className="absolute top-2 left-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white">GIF</div>
      </div>
   );
}
