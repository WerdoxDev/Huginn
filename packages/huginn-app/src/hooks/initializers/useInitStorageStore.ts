import { useClientStore } from "@stores/clientStore";
import { initStorageStoreClient } from "@stores/storageStore";
import { useEffect } from "react";

export function useInitStorageStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      if (!isInitialized) return;
      return initStorageStoreClient();
   }, [isInitialized]);
}
