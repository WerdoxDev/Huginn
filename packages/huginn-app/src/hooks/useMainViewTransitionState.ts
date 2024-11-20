import type { RouteConfigEntry } from "@react-router/dev/routes";
import { useRoutes, useViewTransitionState } from "react-router";

const routes = ["/friends/*", "/channels/*"];

export function useMainViewTransitionState() {
	const allStates = routes.map((x) => useViewTransitionState(x));
	const isTransitioning = allStates.some((x) => x);

	return isTransitioning;
}
