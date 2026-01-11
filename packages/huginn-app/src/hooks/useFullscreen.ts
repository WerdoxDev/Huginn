import { useHuginnWindow } from "@stores/windowStore";
import { type RefObject, useEffect, useState } from "react";

export function useFullscreen(element?: RefObject<HTMLDivElement | null>) {
   const [isFullscreen, setFullscreen] = useState(false);
   const huginnWindow = useHuginnWindow();

   useEffect(() => {
      if (isFullscreen && !huginnWindow.fullscreen) {
         setFullscreen(false);
         document.exitFullscreen();
      }
   }, [huginnWindow.fullscreen]);

   useEffect(() => {
      const controller = new AbortController();

      document.addEventListener(
         "fullscreenchange",
         () => {
            const isFullscreen = document.fullscreenElement !== null;
            setFullscreen(isFullscreen);
            huginnWindow.setFullscreen(isFullscreen);
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort();
      };
   }, []);

   async function toggleFullscreen() {
      if (isFullscreen) {
         await document.exitFullscreen();
      } else {
         if (element?.current) {
            await element.current.requestFullscreen();
         } else {
            await document.body?.requestFullscreen();
         }
      }
   }

   return { isFullscreen, toggleFullscreen };
}
