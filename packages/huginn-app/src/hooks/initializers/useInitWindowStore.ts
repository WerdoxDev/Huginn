import { useClientStore } from "@stores/clientStore";
import { initDeviceStore } from "@stores/deviceStore";
import { initWindowStore } from "@stores/windowStore";
import { useEffect } from "react";

export function useInitWindowStore() {
   const isInitialized = useClientStore().isInitialized;
   useEffect(() => {
      let cancelled = false;
      let unlisten: (() => void) | undefined;
      if (!isInitialized) return;

      initWindowStore().then((unlistenFn) => {
         if (cancelled) unlistenFn?.();
         unlisten = unlistenFn;
      });

      return () => {
         cancelled = true;
         unlisten?.();
      };
   }, [isInitialized]);
}
