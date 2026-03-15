import RouteErrorComponent from "@components/RouteErrorComponent";
import { logger } from "@huginn/shared";

import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { clientStore } from "@stores/clientStore";
import { initializeStorage, storageStore } from "@stores/storageStore";
import { QueryClient } from "@tanstack/react-query";
import { createBrowserHistory, createHashHistory, createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import { RemoteLogger } from "../shared/remote-logger";
import { routeTree } from "./routeTree.gen";

if (import.meta.env.DEV) {
   document.addEventListener("keypress", (e) => {
      if (e.key === "\\") {
         clientStore.getState().client?.gateway.socket?.close();
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
let _remoteLogger: RemoteLogger;

await initializeStorage();

if (window.electronAPI) {
   logger.on("log", ({ section, level, args }) => window.electronAPI.addToLogBuffer("log", section, level, ...args));
   logger.on("error", ({ section, args }) => window.electronAPI.addToLogBuffer("error", section, undefined, ...args));
} else {
   const thisStore = storageStore.getState();
   const settings = thisStore.getCachedValue("settings");
   const clientInfo = thisStore.getCachedValue("client-info");
   const endpoint = new URL("/api/log", settings.apiHostname).toString();
   _remoteLogger = new RemoteLogger(logger, endpoint, clientInfo.id);
}

const history = __IS_ELECTRON__ ? createHashHistory() : createBrowserHistory();

const router = createRouter({
   routeTree: routeTree,
   history: history,
   basepath: !__IS_ELECTRON__ ? "app" : undefined,
   defaultErrorComponent: RouteErrorComponent,
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
   root.render(<RouterProvider router={router} />);
}
