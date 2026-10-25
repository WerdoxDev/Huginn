import { HuginnCheckbox } from "@huginn/frontend-shared";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useState } from "react";

import type { SettingsTabProps } from "@/types";

export default function SettingsSystemTab(_props: SettingsTabProps) {
   const settings = useStorage("settings");
   const { getCachedValue, setValue } = useStorageStore();
   const huginnWindow = useHuginnWindow();

   async function changeAutostart(enabled: boolean) {
      await window.electronAPI.setAutostart(enabled);
      await setValue("settings", { ...getCachedValue("settings"), autostart: enabled });
   }

   if (huginnWindow.environment !== "desktop") {
      return <div className="text-text/70 text-sm">System settings are available in the desktop app.</div>;
   }

   return (
      <div className="flex w-full flex-col items-center justify-center text-white">
         <div className="flex w-full max-w-md flex-col gap-y-5">
            <div>
               <HuginnCheckbox checked={settings.autostart} onChange={(value) => void changeAutostart(value)}>
                  <HuginnCheckbox.Input>Start Huginn at Login</HuginnCheckbox.Input>
               </HuginnCheckbox>
               <div className="text-text/70 mt-2 text-sm">Automatically start Huginn when you sign in to your computer.</div>
            </div>
            <div>
               <HuginnCheckbox
                  checked={settings.useProxy}
                  onChange={(value) => void setValue("settings", { ...getCachedValue("settings"), useProxy: value })}
               >
                  <HuginnCheckbox.Input>Use System Proxy</HuginnCheckbox.Input>
               </HuginnCheckbox>
               <div className="text-text/70 mt-2 text-sm">Use your computer’s proxy settings for network connections.</div>
            </div>
         </div>
      </div>
   );
}
