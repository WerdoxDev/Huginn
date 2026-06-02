import { useClientStore } from "@stores/clientStore";
import { initUserStore } from "@stores/userStore";
import { useEffect } from "react";

export function useInitUserStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      if (!isInitialized) return;
      return initUserStore();
   }, [isInitialized]);
}
