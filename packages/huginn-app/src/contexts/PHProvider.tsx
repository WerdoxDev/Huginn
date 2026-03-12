import type { ReactNode } from "react";

import { logger } from "@huginn/shared";
import { storageStore } from "@stores/storageStore";
import posthog, { type CaptureResult } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function initializePosthog() {
   const settings = storageStore.getState().cache["settings"];

   posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
      api_host: settings.analyticsHostname,
      ui_host: "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_exceptions: true,
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

   logger.on("error", ({ section, args }) => {
      posthog.captureException(`${section}: ${args.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(" ")}`);
   });
}

export default function PHProvider(props: { children?: ReactNode }) {
   return <PostHogProvider client={posthog}>{props.children}</PostHogProvider>;
}
