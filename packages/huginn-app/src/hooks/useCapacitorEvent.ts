import type { PluginListenerHandle } from "@capacitor/core";

import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, type DependencyList } from "react";

export function useCapacitorListener(factory: () => Promise<PluginListenerHandle>, deps?: DependencyList) {
   const huginnWindow = useHuginnWindow();
   const effectDeps = deps ?? [factory];

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      let handle: PluginListenerHandle | null = null;
      let removed = false;

      const register = async () => {
         handle = await factory();

         if (removed) handle.remove();
      };

      register();

      return () => {
         removed = true;
         handle?.remove();
      };
   }, effectDeps);
}
