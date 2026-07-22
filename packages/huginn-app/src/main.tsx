import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { analytics } from "@huginn/shared";
import { runPendingActions } from "@lib/actions";
import { SplashScreen } from "@lib/capacitor/splash-screen";
import { initAnalytics } from "@lib/web-analytics";
import { clientStore } from "@stores/clientStore";
import { initStorageStoreEarly } from "@stores/storageStore";
import { ThemeProvider } from "@stores/themeStore";
import { initWindowStore } from "@stores/windowStore";
import { RouterProvider } from "@tanstack/react-router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { createRoot } from "react-dom/client";

import { router } from "./router";

CapacitorUpdater.notifyAppReady();

if (import.meta.env.DEV) {
   document.addEventListener("keypress", (e) => {
      if (e.key === "\\") {
         // clientStore.getState().client?.gateway.close();
         clientStore.getState().client?.gateway.socket?.close();
         // setTimeout(async () => {
         //    clientStore.getState().client?.gateway.connect();
         //    await clientStore.getState().client?.gateway.authenticate();
         // }, 2000);
      }
      if (e.key === "]") {
         // clientStore.getState().client?.voice.signaling.socket?.close();
         const conn = { ...clientStore.getState().client?.voice.signaling.connectionData };
         clientStore.getState().client?.voice.signaling.close();
         setTimeout(async () => {
            await clientStore.getState().client?.voice.signaling.connect(conn.token, conn.channelId, conn.guildId);
         }, 2000);
      } else if (e.key === "[") {
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

if (__IS_CAPACITOR__) {
   await SplashScreen.hide();
}

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

createRoot(document.getElementById("root")!).render(
   <PostHogProvider client={posthog}>
      <ThemeProvider>
         <RouterProvider router={router} />
      </ThemeProvider>
   </PostHogProvider>,
);
