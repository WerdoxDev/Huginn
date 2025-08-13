import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { useFilesStore } from "@stores/filesStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useEffect, type ReactNode } from "react";

export default function KeybindsProvider(props: { children?: ReactNode }) {
   const { toggleDeafen, toggleMute } = useVoiceUtils();
   const { localVoiceState } = useVoiceStore();
   const { keybinds } = useFilesStore();

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
         window.electronAPI.updateKeybinds(keybinds);
      }
   }, [keybinds]);

   return props.children;
}
