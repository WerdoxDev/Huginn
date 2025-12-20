import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { clientStore } from "@stores/clientStore";
import router from "./routes";
import { logger } from "@huginn/shared";
import { RemoteLogger } from "../shared/remote-logger";
import { initializeStorage, storageStore } from "@stores/storageStore";

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
   logger.setOnLog((section, level, ...args) => window.electronAPI.addToLogBuffer("log", section, level, ...args));
   logger.setOnError((section, ...args) => window.electronAPI.addToLogBuffer("error", section, undefined, ...args));
} else {
   const thisStore = storageStore.getState();
   const settings = thisStore.getCachedValue("settings");
   const clientInfo = thisStore.getCachedValue("client-info");
   const endpoint = new URL("/api/log", settings.apiHostname).toString();
   // oxlint-disable-next-line no-import-assign
   _remoteLogger = new RemoteLogger(logger, endpoint, clientInfo.id);
}

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
