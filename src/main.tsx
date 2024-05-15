import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree, defaultPreload: "intent", defaultPreloadDelay: 100 });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
   // <div className="flex h-full flex-col overflow-hidden" :class="isMaximized ? 'rounded-none' : 'rounded-lg'">
   <div className="flex h-full flex-col overflow-hidden">
      <div className="relative h-full w-full">
         <React.StrictMode>
            <RouterProvider router={router} />
         </React.StrictMode>
      </div>
   </div>,
);
