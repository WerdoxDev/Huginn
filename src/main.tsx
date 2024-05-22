import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const router = createRouter({
   routeTree,
   defaultPreload: "intent",
   defaultPreloadDelay: 200,
   defaultPreloadStaleTime: 0,
   context: { queryClient },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
   type Register = {
      router: typeof router;
   };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
   // <div className="flex h-full flex-col overflow-hidden" :class="isMaximized ? 'rounded-none' : 'rounded-lg'">
   <div className="flex h-full flex-col overflow-hidden">
      <div className="relative h-full w-full">
         <React.StrictMode>
            <QueryClientProvider client={queryClient}>
               <RouterProvider router={router} />
            </QueryClientProvider>
         </React.StrictMode>
      </div>
   </div>,
);
