import LinkButton from "@components/button/LinkButton";
import HuginnIcon from "@components/HuginnIcon";
import { useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";

export default function SettingsAboutTab() {
   const huginnWindow = useHuginnWindow();
   const clientInfo = useStorage("client-info");

   return (
      <div className="text-text mt-5 w-full">
         <div className="mb-5 flex items-center gap-x-3">
            <HuginnIcon outlined className="h-16 w-16" />
            <span className="text-2xl font-bold">Huginn</span>
         </div>
         <div>
            <span>A simple, yet playful chat application to make chatting,</span> <span className="text-text/70">well... </span>
            <span className="font-bold">FUN!</span> Inspired by <span className="text-positive-100">Norse mythology</span>, it captures the spirit of{" "}
            <span className="text-primary-500 font-bold">Huginn</span>, one of <span className="text-negative-100">Odin's</span> ravens, symbolizing
            thought and
            <span> memory.</span>
         </div>
         <div className="mt-10">
            <div>
               <span className="text-text/70">Author: </span>
               <span>Matin Tat (Werdox)</span>
            </div>
            <div>
               <span className="text-text/70">Github: </span>
               <LinkButton
                  onClick={() =>
                     huginnWindow.environment === "desktop"
                        ? window.electronAPI.openExternal("https://github.com/WerdoxDev")
                        : open("https://github.com/WerdoxDev")
                  }
                  className="text-base"
               >
                  https://github.com/WerdoxDev
               </LinkButton>
            </div>
            <div className="mt-2">
               <span className="text-text/70">App version: </span>
               {huginnWindow.version}
            </div>
            <div>
               <span className="text-text/70">Client ID: </span>
               {clientInfo.id}
            </div>
         </div>
      </div>
   );
}
