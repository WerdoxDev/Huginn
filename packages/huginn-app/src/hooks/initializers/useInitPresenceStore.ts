import { useClientStore } from "@stores/clientStore";
import { initPresenceStore } from "@stores/presenceStore";
import { useEffect } from "react";

export function useInitPresenceStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      if (!isInitialized) return;
      return initPresenceStore();
   }, [isInitialized]);
}
