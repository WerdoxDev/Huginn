import type { HuginnClient } from "@huginn/api";
import type { APIDMChannel, APIGroupDMChannel } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { PostHog } from "posthog-js";

export function setup(client: HuginnClient, posthog: PostHog) {
	const pathname = router.state.location.pathname;
	if (!routeHistory.initialPathname) routeHistory.initialPathname = pathname;
	posthog.capture("$pageview", { $current_url: window.origin + pathname });

	if (pathname === "/splashscreen") {
		return;
	}

	if (pathname === "/") {
		throw redirect({ to: "/login" });
	}

	if (client.isLoggedIn) {
		return;
	}
	if (pathname !== "/login" && pathname !== "/register") {
		throw redirect({ to: "/login", mask: pathname });
	}
}

export function ensureChannelExists(channelId: Snowflake, queryClient: QueryClient) {
	const channels: (APIDMChannel | APIGroupDMChannel)[] | undefined = queryClient.getQueryData(["channels", "@me"]);
	const safePathname = routeHistory.lastPathname?.includes(channelId) ? "/channels/@me" : routeHistory.lastPathname;
	if (!channels?.some((x) => x.id === channelId)) throw redirect({ to: safePathname });
}

export function requireAuth(client: HuginnClient) {
	if (!client.isLoggedIn) {
		throw redirect({ to: "/login" });
	}
}

export function requireNotAuth(client: HuginnClient) {
	if (client.isLoggedIn) {
		throw redirect({ to: "/channels/@me" });
	}
}
