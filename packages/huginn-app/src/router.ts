import ErrorComponent from "@components/ErrorComponent";
import { createBrowserHistory, createHashHistory, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

const history = __IS_ELECTRON__ ? createHashHistory() : createBrowserHistory();

export const router = createRouter({
   routeTree: routeTree,
   history: history,
   basepath: !__IS_ELECTRON__ ? "app" : undefined,
   defaultErrorComponent: ErrorComponent,
   defaultPendingMinMs: 0,
   defaultPendingMs: 0,
});
