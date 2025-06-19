import { useViewTransitionState } from "react-router";

const startRoutes = ["/login", "/register", "/oauth-redirect", "/"];
const mainRoutes = ["/channels/*", "/friends"];

export function useMainViewTransitionState() {
   const startRouteStates = startRoutes.map((x) => useViewTransitionState(x));
   const mainRouteStates = mainRoutes.map((x) => useViewTransitionState(x));

   const isStartTransitioning = startRouteStates.some((x) => x);
   const isMainTransitioning = mainRouteStates.some((x) => x);

   return { isStartTransitioning, isMainTransitioning };
}
