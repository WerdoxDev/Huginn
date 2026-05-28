import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { dispatchEvent } from "@lib/event-handler";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { Environment } from "@/types";

import { router } from "@/main";

const store = createStore(
   combine(
      {
         maximized: false,
         fullscreen: false,
         browserFullscreen: false,
         focused: false,
         environment: (window.electronAPI ? "desktop" : Capacitor.getPlatform() === "android" ? "android" : "browser") as Environment,
         args: [] as string[],
         version: "",
         processId: 0,
      },
      (set) => ({
         setMaximized: (isMaximized: boolean) => set({ maximized: isMaximized }),
         setFullscreen: (isFullscreen: boolean) => set({ fullscreen: isFullscreen }),
         setBrowserFullscreen: (isFullscreen: boolean) => set({ browserFullscreen: isFullscreen }),
      }),
   ),
);

export async function initializeWindow() {
   store.setState({
      maximized: false,
      fullscreen: false,
      browserFullscreen: false,
      focused: document.hasFocus(),
      args: window.electronAPI ? await window.electronAPI.getArgs() : undefined,
      version: window.electronAPI ? await window.electronAPI.getVersion() : __APP_VERSION__,
      processId: window.electronAPI ? await window.electronAPI.processId() : 0,
   });

   console.log("Environment:", store.getState().environment);

   const controller = new AbortController();

   function onFocusChange(event: FocusEvent) {
      store.setState({ focused: event.type === "focus" });
   }

   window.addEventListener("focus", onFocusChange, { signal: controller.signal });
   window.addEventListener("blur", onFocusChange, { signal: controller.signal });

   document.addEventListener(
      "fullscreenchange",
      () => {
         store.setState({ browserFullscreen: document.fullscreenElement !== null });
      },
      { signal: controller.signal },
   );

   const unlisteners: Array<(() => void) | undefined> = [];
   const thisStore = store.getState();
   if (thisStore.environment === "desktop") {
      unlisteners.push(
         window.electronAPI.onDeepLink((_, cmd) => {
            dispatchEvent("deep_link", cmd);
         }),
      );

      unlisteners.push(
         window.electronAPI.onMaximizedChanged((_, isMaximized) => {
            store.setState({ maximized: isMaximized });
         }),
      );

      unlisteners.push(
         window.electronAPI.onFullscreenChanged((_, isFullscreen) => {
            store.setState({ fullscreen: isFullscreen });
         }),
      );
   }

   if (thisStore.environment === "android") {
      unlisteners.push(
         (
            await App.addListener("appUrlOpen", (event) => {
               console.log("Received deep link:", event.url);
               dispatchEvent("deep_link", event.url);
            })
         ).remove,
      );
   }

   return () => {
      controller.abort();
      for (const unlisten of unlisteners) {
         unlisten?.();
      }
   };
}

export const windowStore = store;

export function useHuginnWindow() {
   return useStore(store);
}
