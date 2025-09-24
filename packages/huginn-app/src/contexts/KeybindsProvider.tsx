import { usePrevious } from "@hooks/usePrevious";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useModals } from "@stores/modalsStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useEffect, type ReactNode } from "react";

export default function KeybindsProvider(props: { children?: ReactNode }) {
   const { toggleDeafen, toggleMute } = useVoiceUtils();
   const { localVoiceState } = useVoiceStore();
   const keybinds = useStorage("keybinds");
   const { setValue } = useStorageStore();
   const { showError } = useModals();
   const previousKeybinds = usePrevious(keybinds);

   useEffect(() => {
      if (!window.electronAPI) {
         return;
      }

      const unlisten = window.electronAPI.onKeybindFired((_, type) => {
         switch (type) {
            case "toggle_mute":
               toggleMute();
               break;
            case "toggle_deafen":
               toggleDeafen();
               break;
         }
      });

      return () => {
         unlisten();
      };
   }, [localVoiceState]);

   useEffect(() => {
      if (window.electronAPI) {
         window.electronAPI.updateKeybinds(keybinds).then((x) => {
            if (!x) {
               showError("Due to software limitations, you can't use this Keybind!");

               if (previousKeybinds) {
                  setValue("keybinds", previousKeybinds);
               }
            }
         });
      }
   }, [keybinds]);

   return props.children;
}
