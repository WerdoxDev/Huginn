import { useClientStore } from "@stores/clientStore";
import { initVoiceStore } from "@stores/voiceStore";
import { useEffect } from "react";

export function useInitVoiceStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      let cancelled = false;
      let unlisten: (() => void) | undefined;
      if (!isInitialized) return;

      initVoiceStore().then((unlistenFn) => {
         if (cancelled) unlistenFn?.();
         unlisten = unlistenFn;
      });

      return () => {
         cancelled = true;
         unlisten?.();
      };
   }, [isInitialized]);
}
