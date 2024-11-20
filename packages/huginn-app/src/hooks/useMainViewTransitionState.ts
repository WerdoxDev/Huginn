import { useViewTransitionState } from "react-router";

// const routes = ["/friends/*", "/channels/*"];
const routes = ["/login", "/register", "/oauth-redirect"];

export function useMainViewTransitionState() {
	const allStates = routes.map((x) => useViewTransitionState(x));
	const isTransitioning = allStates.some((x) => x);

	return isTransitioning;
}
