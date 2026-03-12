import { useHuginnWindow } from "@stores/windowStore";
import { createPortal } from "react-dom";

import ConnectionStatus from "./ConnectionStatus";

export default function TitleBar() {
   const huginnWindow = useHuginnWindow();

   async function minimize() {
      window.electronAPI.minimize();
   }

   async function maximize() {
      window.electronAPI.toggleMaximize();
   }

   async function close() {
      window.electronAPI.hideMain();
   }

   return createPortal(
      <div
         className="drag-region bg-surface fixed top-0 right-0 left-0 z-40 flex h-6 shrink-0 items-center overflow-hidden select-none"
         style={{ viewTransitionName: "title-bar" }}
      >
         <div className="text-text pointer-events-none mx-2 shrink-0 text-xs font-medium uppercase">Huginn</div>
         <ConnectionStatus />
         {huginnWindow.environment === "desktop" && (
            <div className="no-drag-region ml-auto flex h-full">
               <button type="button" className="hover:bg-surface-alt flex h-full w-10 cursor-pointer items-center justify-center" onClick={minimize}>
                  <IconMingcuteMinimizeFill className="h-4 w-4 text-white opacity-80" />
               </button>
               <button type="button" className="hover:bg-surface-alt flex h-full w-10 cursor-pointer items-center justify-center" onClick={maximize}>
                  {huginnWindow.maximized ? (
                     <IconMingcuteFullscreenExitFill className="h-4 w-4 text-white opacity-80" />
                  ) : (
                     <IconMingcuteFullscreenFill className="h-4 w-4 text-white opacity-80" />
                  )}
               </button>
               <button type="button" className="hover:bg-negative-100 flex h-full w-10 cursor-pointer items-center justify-center" onClick={close}>
                  <IconMingcuteCloseFill className="h-4 w-4 text-white opacity-80" />
               </button>
            </div>
         )}
      </div>,
      document.body,
   );
}
