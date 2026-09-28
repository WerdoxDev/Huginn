import "./index.css";
import type { ThemeType } from "@huginnjs/shared";

import { themeStore } from "@stores/themeStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import { queryClient } from "./lib/queries";
import { router } from "./router";

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

const container = document.getElementById("root");
if (!container) {
   throw new Error("App container not found");
}

const theme = (localStorage.getItem("theme") as string) || "pine-green";
if (theme) {
   themeStore.actions.setTheme(theme as ThemeType);
}

createRoot(container).render(
   <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
   </QueryClientProvider>,
);
