import { useClientStore } from "@stores/clientStore";
import { initVoiceStore } from "@stores/voiceStore";
import { useEffect } from "react";

export function useInitVoiceStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      if (!isInitialized) return;
      return initVoiceStore();
   }, [isInitialized]);
}
