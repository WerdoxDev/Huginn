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
         clientStore.getState().client?.voice.socket?.close();
      }
   });
}

logger.enableLogs({
   // "api:voice": ["default", "send", "recv", "heartbeat"],
   "app:audio-source-player": ["default"],
   "api:voice": ["default", "recv", "heartbeat"],
   "app:voice-store": ["remote-sources", "default"],
   "app:voice-client": ["voice-recv", "default"],
   "api:gateway": ["default", "recv", "heartbeat"],
   "api:client": ["ready-state"],
   "app:client-store": ["default"],
   "app:presence-store": ["default"],
});

logger.excludeEventLogs({ "app:voice-store": ["speaking-state"], "api:voice": ["local-voice-state"] });
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

// setInterval(async () => {
//    if (logs.length !== 0) {
//       await clientStore.getState().client?.log.sendLog(logs);
//       logs.splice(0, logs.length);
//    }
// }, 5000);

// let lastTime = performance.now();
// let count = 0;
// setInterval(() => {
// 	const currentTime = performance.now();
// 	console.log(count, currentTime - lastTime);
// 	count++;
// 	lastTime = currentTime;
// }, 1000);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
