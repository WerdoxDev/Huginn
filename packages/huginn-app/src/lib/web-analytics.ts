import { analytics, initAnalytics as externalInitAnalytics } from "@huginnjs/shared";
import { WebAnalytics } from "@huginnjs/shared/web-analytics";
import { storageStore } from "@stores/storageStore";

export function initAnalytics() {
   const store = storageStore.getState();
   const settings = store.cache["settings"];
   const clientInfo = store.cache["client-info"];
   const urls = settings.currentUrls;

   externalInitAnalytics(
      new WebAnalytics(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
         otlpTraceUrl: `${urls.otlp}/v1/traces`,
         otlpLogUrl: `${urls.otlp}/v1/logs`,
         posthogHost: urls.posthog,
         serviceName: "app-web",
         environment: import.meta.env.PROD ? "production" : "development",
         serviceVersion: __APP_VERSION__,
         clientId: clientInfo.id,
      }),
   );

   store.storage.adapter.setAnalytics(analytics);
}
