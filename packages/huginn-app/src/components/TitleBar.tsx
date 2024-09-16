import { useWindow } from "@contexts/windowContext";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ReactPortal } from "react";
import { createPortal } from "react-dom";

const appWindow = getCurrentWebviewWindow();

export default function TitleBar(): ReactPortal {
   const huginnWindow = useWindow();

   async function minimize() {
      await appWindow?.minimize();
   }

   async function maximize() {
      await appWindow?.toggleMaximize();
   }

   async function close() {
      await appWindow?.close();
   }

   return createPortal(
      <div
         className={`bg-background fixed left-0 right-0 top-0 flex h-6 shrink-0 select-none items-center overflow-hidden ${huginnWindow.maximized ? "rounded-t-none" : "rounded-t-lg"}`}
         data-tauri-drag-region
      >
         <div className="text-text mx-3.5 flex-shrink-0 text-xs font-medium uppercase">Huginn</div>
         <div className="w-full flex-shrink"></div>
         <div className="flex h-full gap-x-1">
            <button className="hover:bg-secondary flex h-full w-8 items-center justify-center" onClick={minimize}>
               <IconMdiMinimize className="h-4 w-4 text-white opacity-80" />
            </button>
            <button className="hover:bg-secondary flex h-full w-8 items-center justify-center" onClick={maximize}>
               <IconMdiMaximize className="h-4 w-4 text-white opacity-80" />
            </button>
            <button className="hover:bg-error flex h-full w-8 items-center justify-center" onClick={close}>
               <IconMdiClose className="h-4 w-4 text-white opacity-80" />
            </button>
         </div>
      </div>,
      document.body,
   );
}
