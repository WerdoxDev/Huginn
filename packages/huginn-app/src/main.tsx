import ErrorComponent from "@components/ErrorComponent";
import { logger } from "@huginn/shared";

import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { initAnalytics } from "@lib/web-analytics";
import { clientStore } from "@stores/clientStore";
import { initStorageStoreEarly } from "@stores/storageStore";
import { initWindowStore } from "@stores/windowStore";
import { createBrowserHistory, createHashHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { createRoot } from "react-dom/client";

import { routeTree } from "./routeTree.gen";

if (import.meta.env.DEV) {
   document.addEventListener("keypress", (e) => {
      if (e.key === "\\") {
         clientStore.getState().client?.gateway.close();
         setTimeout(async () => {
            clientStore.getState().client?.gateway.connect();
            await clientStore.getState().client?.gateway.authenticate();
         }, 2000);
      }
      if (e.key === "]") {
         clientStore.getState().client?.voice.signaling.socket?.close();
      }
   });
}

window.addEventListener("unhandledrejection", (d) => {
   console.log(d);
});

logger.enableLogs({
   // "api:voice": ["default", "send", "recv", "heartbeat"],
   // "app:audio-level-checker": ["default"],
   "api:voice": ["default"],
   "api:voice-manager": ["default"],
   "api:voice-device": ["default"],
   "api:voice-signaling": ["heartbeat", "default"],
   "api:voice-transport": ["default"],
   "api:voice-stream": ["default"],
   "app:voice-store": ["remote-sources", "default"],
   "app:voice-client": ["voice-recv", "default"],
   "api:gateway": ["default", "recv", "heartbeat"],
   "api:client": ["ready-state"],
   "app:client-store": ["default"],
   "app:presence-store": ["default"],
});

logger.excludeEventLogs({ "app:voice-store": ["speaking-state"] });
logger.setIsRaw(import.meta?.env?.PROD ?? false);

await initStorageStoreEarly();
await initWindowStore();
initAnalytics();

// if (window.electronAPI) {
//    logger.on("log", ({ section, level, args }) => window.electronAPI.addToLogBuffer("log", section, level, ...args));
//    logger.on("error", ({ section, args }) => window.electronAPI.addToLogBuffer("error", section, undefined, ...args));
// } else {
//    const thisStore = storageStore.getState();
//    const settings = thisStore.getCachedValue("settings");
//    const clientInfo = thisStore.getCachedValue("client-info");
//    const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);
//    if (activePreset?.apiHostname) {
//       const endpoint = new URL("/api/log", activePreset.apiHostname).toString();
//       _remoteLogger = new RemoteLogger(logger, endpoint, clientInfo.id);
//    }
// }

const history = __IS_ELECTRON__ ? createHashHistory() : createBrowserHistory();

export const router = createRouter({
   routeTree: routeTree,
   history: history,
   basepath: !__IS_ELECTRON__ ? "app" : undefined,
   defaultErrorComponent: ErrorComponent,
   defaultPendingMinMs: 0,
   defaultPendingMs: 0,
});

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
   const root = createRoot(rootElement);
   root.render(
      <PostHogProvider client={posthog}>
         <RouterProvider router={router} />
      </PostHogProvider>,
   );
}
