import { appWindow } from "@tauri-apps/api/window";
import { createPortal } from "react-dom";
import { useWindow } from "../contexts/windowContext";

export default function TitleBar() {
   const huginnWindow = useWindow();

   function minimize() {
      appWindow.minimize();
   }

   function maximize() {
      appWindow.toggleMaximize();
   }

   function close() {
      appWindow.close();
   }
   return createPortal(
      <div
         className={`fixed left-0 right-0 top-0 flex h-6 shrink-0 select-none items-center overflow-hidden bg-background ${huginnWindow.maximized ? "rounded-t-none" : "rounded-t-lg"}`}
         data-tauri-drag-region
      >
         <div className="mx-3.5 flex-shrink-0 text-xs font-medium uppercase text-text">Huginn</div>
         <div className="w-full flex-shrink"></div>
         <div className="flex h-full gap-x-1">
            <button className="flex h-full w-8 items-center justify-center hover:bg-secondary" onClick={minimize}>
               <IconMdiMinimize className="h-4 w-4 text-white opacity-80" />
            </button>
            <button className="flex h-full w-8 items-center justify-center hover:bg-secondary" onClick={maximize}>
               <IconMdiMaximize className="h-4 w-4 text-white opacity-80" />
            </button>
            <button className="flex h-full w-8 items-center justify-center hover:bg-error" onClick={close}>
               <IconMdiClose className="h-4 w-4 text-white opacity-80" />
            </button>
         </div>
      </div>,
      document.body,
   );
}
