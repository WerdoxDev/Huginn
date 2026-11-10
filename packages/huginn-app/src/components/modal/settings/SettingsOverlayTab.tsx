import { HuginnCheckbox } from "@huginn/frontend-shared";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";

import type { SettingsTabProps } from "@/types";

export default function SettingsOverlayTab(_props: SettingsTabProps) {
   const settings = useStorage("settings");
   const { updateSettings } = useStorageStore();
   const { environment } = useHuginnWindow();

   if (environment !== "desktop") {
      return <div className="text-text/70 text-sm">Overlay settings are available in the desktop app.</div>;
   }

   return (
      <div className="flex w-full flex-col items-center justify-center text-white">
         <div className="flex w-full max-w-md flex-col gap-y-5">
            <div>
               <HuginnCheckbox checked={settings.overlayEnabled ?? true} onChange={(value) => void updateSettings({ overlayEnabled: value })}>
                  <HuginnCheckbox.Input>Enable Overlay</HuginnCheckbox.Input>
               </HuginnCheckbox>
               <div className="text-text/70 max-w-sm text-sm">
                  Show the overlay in applications that have it enabled. Turning this off keeps your per-application preferences.
               </div>
            </div>
            <div>
               <HuginnCheckbox
                  checked={settings.voiceOverlayOnlySpeaking ?? false}
                  onChange={(value) => void updateSettings({ voiceOverlayOnlySpeaking: value })}
               >
                  <HuginnCheckbox.Input>Only Show Users Who Are Talking</HuginnCheckbox.Input>
               </HuginnCheckbox>
               <div className="text-text/70 max-w-sm text-sm">Hide silent users in the voice overlay instead of showing them at low opacity.</div>
            </div>
         </div>
      </div>
   );
}
