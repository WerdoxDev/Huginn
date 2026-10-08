import { analytics, reinitializeAnalytics } from "@huginnjs/shared";
import { WebAnalytics } from "@huginnjs/shared/web-analytics";
import { storageStore } from "@stores/storageStore";

let changeHandlerRegistered = false;

function getAnalyticsConfigurationKey(): string {
   const { settings, instances } = storageStore.getState().cache;
   const activeInstance = instances?.find((instance) => instance.id === settings?.currentInstanceId);
   return JSON.stringify({
      currentInstanceId: settings?.currentInstanceId,
      currentAccessAddress: settings?.currentAccessAddress,
      currentUrls: settings?.currentUrls,
      activeInstance,
   });
}

async function reinitializeRendererAnalytics(): Promise<void> {
   const store = storageStore.getState();
   const settings = store.cache["settings"];
   const clientInfo = store.cache["client-info"];
   const urls = settings.currentUrls;

   await reinitializeAnalytics(
      () =>
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

async function reinitializeAllAnalytics(): Promise<void> {
   await Promise.all([reinitializeRendererAnalytics(), window.electronAPI?.reinitializeAnalytics()]);
}

export async function initAnalytics(): Promise<void> {
   await reinitializeRendererAnalytics();

   if (changeHandlerRegistered) return;
   changeHandlerRegistered = true;
   storageStore.subscribe(
      () => getAnalyticsConfigurationKey(),
      (configuration, previousConfiguration) => {
         if (configuration === previousConfiguration) return;
         void reinitializeAllAnalytics().catch((error) => console.error("Failed to reinitialize analytics", error));
      },
   );
}
