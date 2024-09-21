import DefaultNotFound from "@components/DefaultNotFound";
import { APIProvider } from "@contexts/apiContext";
import { EventProvider } from "@contexts/eventContext";
import { SettingsProvider } from "@contexts/settingsContext";
import { WindowProvider } from "@contexts/windowContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import ReactDOM from "react-dom/client";
import HuginnRouterProvider from "./HuginnRouterProvider";
import "./index.css";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
   defaultOptions: { queries: { refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: 60000 } },
});

const posthogClient = posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
   api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
   person_profiles: "always",
   autocapture: false,
   capture_pageview: false,
});

export const router = createRouter({
   routeTree,
   // defaultPreload: "intent",
   // defaultPreloadDelay: 200,
   defaultPreloadStaleTime: 0,
   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
   context: { queryClient, client: undefined!, posthog: posthogClient! },
   defaultNotFoundComponent: DefaultNotFound,
   unmaskOnReload: true,
   // defaultGcTime: 0,
   // defaultErrorComponent: DefaultError,
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
      <PostHogProvider client={posthogClient}>
         <QueryClientProvider client={queryClient}>
            <EventProvider>
               <SettingsProvider>
                  <APIProvider>
                     <WindowProvider>
                        <HuginnRouterProvider router={router} />
                     </WindowProvider>
                  </APIProvider>
               </SettingsProvider>
            </EventProvider>
         </QueryClientProvider>
      </PostHogProvider>
   </React.StrictMode>,
);
