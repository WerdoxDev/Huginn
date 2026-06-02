import { useClientStore } from "@stores/clientStore";
import { initDeviceStore } from "@stores/deviceStore";
import { useEffect } from "react";

export function useInitDeviceStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      let cancelled = false;
      let unlisten: (() => void) | undefined;
      if (!isInitialized) return;

      initDeviceStore().then((unlistenFn) => {
         if (cancelled) unlistenFn?.();
         unlisten = unlistenFn;
      });

      return () => {
         cancelled = true;
         unlisten?.();
      };
   }, [isInitialized]);
}
