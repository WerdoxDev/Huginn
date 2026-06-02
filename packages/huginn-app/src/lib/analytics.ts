import { logger } from "@huginn/shared";
import { storageStore } from "@stores/storageStore";
import { posthog, type CaptureResult } from "posthog-js";

let unlistenLogger: (() => void) | undefined;

export function initAnalytics() {
   const settings = storageStore.getState().cache["settings"];
   const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);

   if (posthog.__loaded) {
      posthog.reset(true);
      unlistenLogger?.();
   }

   posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
      api_host: activePreset?.analyticsHostname ?? "",
      ui_host: "https://eu.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      logs: {
         serviceName: "app-web",
         environment: import.meta.env.PROD ? "production" : "development",
         serviceVersion: __APP_VERSION__,
      },
      persistence: __IS_ELECTRON__ ? "memory" : "localStorage",
      capture_pageview: !__IS_ELECTRON__,
      bootstrap: { distinctID: storageStore.getState().cache["client-info"]?.id },

      // debug: import.meta.env.DEV,
      before_send: (event: CaptureResult | null): CaptureResult | null => {
         if (event?.properties?.$current_url) {
            // parse the URL
            const parsed = new URL(event.properties.$current_url);

            // if there is a hash in the URL, we want to include it in the $pathname property
            if (parsed.hash) {
               event.properties.$pathname = parsed.pathname + parsed.hash;
            }
         }
         return event;
      },
      capture_performance: true,
      error_tracking: { captureExtensionExceptions: true },
   });

   unlistenLogger = logger.listen("error", ({ section, args }) => {
      posthog.captureException(`${section}: ${args.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(" ")}`);
   });
}
