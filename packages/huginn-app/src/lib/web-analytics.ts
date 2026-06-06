import { analytics, initAnalytics as externalInitAnalytics } from "@huginn/shared";
import { WebAnalytics } from "@huginn/shared/web-analytics";
import { storageStore } from "@stores/storageStore";

// let unlistenLogger: (() => void) | undefined;

export function initAnalytics() {
   const store = storageStore.getState();
   const settings = store.cache["settings"];
   const clientInfo = store.cache["client-info"];
   const activePreset = settings.hostnamePresets.find((p) => p.name === settings.activePresetName)!;

   externalInitAnalytics(
      new WebAnalytics(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
         // TODO: use otel hostname from settings
         otlpTraceUrl: `${activePreset.otelHostname}/v1/traces`,
         otlpLogUrl: `${activePreset.otelHostname}/v1/logs`,
         posthogHost: activePreset.posthogHostname,
         serviceName: "app-web",
         environment: import.meta.env.PROD ? "production" : "development",
         serviceVersion: __APP_VERSION__,
         clientId: clientInfo.id,
      }),
   );

   store.storage.adapter.setAnalytics(analytics);

   // unlistenLogger = logger.listen("error", ({ section, args }) => {
   //    posthog.captureException(`${section}: ${args.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(" ")}`);
   // });
}
