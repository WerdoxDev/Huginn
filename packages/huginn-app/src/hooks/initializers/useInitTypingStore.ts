import { useClientStore } from "@stores/clientStore";
import { initTypingStore } from "@stores/typingStore";
import { useEffect } from "react";

export function useInitTypingStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      if (!isInitialized) return;
      return initTypingStore();
   }, [isInitialized]);
}
