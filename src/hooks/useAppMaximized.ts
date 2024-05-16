import { appWindow } from "@tauri-apps/api/window";
import { useContext, useEffect, useState } from "react";
import { WindowContext } from "../contexts/windowContext";
import { UnlistenFn } from "@tauri-apps/api/event";

export default function useAppMaximized() {
   const { setMaximized } = useContext(WindowContext).maximized;
   const [unlistenEvent, setUnlistenEvent] = useState<UnlistenFn>();

   useEffect(() => {
      async function listenToAppResize() {
         const unlisten = await appWindow.onResized(async () => {
            const appMaximized = await appWindow.isMaximized();
            setMaximized(appMaximized);
         });

         setUnlistenEvent(unlisten);
      }

      listenToAppResize();
   }, []);

   return { unlistenEvent };
}
