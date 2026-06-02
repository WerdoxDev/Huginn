import { useClientStore } from "@stores/clientStore";
import { initReadStateStore } from "@stores/readStateStore";
import { useEffect } from "react";

export function useInitReadStateStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      if (!isInitialized) return;
      return initReadStateStore();
   }, [isInitialized]);
}
