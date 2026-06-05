import ErrorComponent from "@components/ErrorComponent";

import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { analytics } from "@huginn/shared";
import { runPendingActions } from "@lib/actions";
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
   analytics.startActiveSpan("unhandledrejection", async (span) => {
      span.setAttribute("reason", d.reason instanceof Error ? (d.reason.stack ?? d.reason.message) : JSON.stringify(d.reason));
      console.log(d);
      span.end();
   });
});

await initStorageStoreEarly();
await runPendingActions();
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
