import "./style.css";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import About from "./About";
import App from "./App";
import Download from "./Download";
import Home from "./Home";
import Redirect from "./Redirect";
import { ThemeProvider } from "./scripts/useChangeTheme";

const rootRoute = createRootRoute({
   component: App,
});

const indexRoute = createRoute({
   getParentRoute: () => rootRoute,
   path: "/",
   component: Home,
});

const aboutRoute = createRoute({
   getParentRoute: () => rootRoute,
   path: "about",
   component: About,
});

const downloadRoute = createRoute({
   getParentRoute: () => rootRoute,
   path: "download",
   component: Download,
});

const redirectRoute = createRoute({
   getParentRoute: () => rootRoute,
   path: "redirect",
   component: Redirect,
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, downloadRoute, redirectRoute]);

const router = createRouter({
   routeTree,
});

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

const container = document.getElementById("app");
if (!container) {
   throw new Error("App container not found");
}

createRoot(container).render(
   <ThemeProvider>
      <RouterProvider router={router} />
   </ThemeProvider>,
);
