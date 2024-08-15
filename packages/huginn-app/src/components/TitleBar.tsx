import { appWindow } from "@tauri-apps/api/window";
import { createPortal } from "react-dom";
import { useWindow } from "@contexts/windowContext";

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
