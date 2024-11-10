import type { HuginnClient } from "@huginn/api";
import { redirect } from "@tanstack/react-router";
import type { PostHog } from "posthog-js";

export function setup(client: HuginnClient, posthog: PostHog) {
	const pathname = router.state.location.pathname;
	if (!routeHistory.initialPathname) routeHistory.initialPathname = pathname;
	posthog.capture("$pageview", { $current_url: window.origin + pathname });

	if (pathname === "/splashscreen" || pathname === "/redirect") {
		return;
	}

	if (pathname === "/") {
		throw redirect({ to: "/login" });
	}

	if (client.isLoggedIn) {
		return;
	}
	if (pathname !== "/login" && pathname !== "/register" && pathname !== "/oauth-redirect") {
		throw redirect({ to: "/login", mask: pathname });
	}
}
