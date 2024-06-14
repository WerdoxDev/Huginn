import DefaultNotFound from "@components/DefaultNotFound";
import { APIProvider } from "@contexts/apiContext";
import { SettingsProvider } from "@contexts/settingsContext";
import { WindowProvider } from "@contexts/windowContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import React from "react";
import HuginnRouterProvider from "./HuginnRouterProvider";
import { routeTree } from "./routeTree.gen";
import ReactDOM from "react-dom/client";
import "./index.css";

const queryClient = new QueryClient();

export const router = createRouter({
   routeTree,
   // defaultPreload: "intent",
   // defaultPreloadDelay: 200,
   defaultPreloadStaleTime: 0,
   context: { queryClient, client: undefined! },
   defaultNotFoundComponent: DefaultNotFound,
   // defaultGcTime: 0,
   // defaultErrorComponent: DefaultError,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
   type Register = {
      router: typeof router;
   };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
   // <React.StrictMode>
   <QueryClientProvider client={queryClient}>
      <SettingsProvider>
         <APIProvider>
            <WindowProvider>
               <HuginnRouterProvider router={router} />
            </WindowProvider>
         </APIProvider>
      </SettingsProvider>
   </QueryClientProvider>,
   // </React.StrictMode>,
);
