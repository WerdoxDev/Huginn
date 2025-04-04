import RouteErrorComponent from "@components/RouteErrorComponent";
import { HistoryProvider } from "@contexts/historyContext";
import { client, initializeClient } from "@stores/apiStore";
import { initializeSettings } from "@stores/settingsStore";
import { ThemeProvier } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import highlightjs from "highlight.js/styles/atom-one-dark.css?url";
// import { PostHogProvider } from "posthog-js/react";
// import posthog from "posthog-js";
import { type ReactNode, useEffect, useState } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";
import type { Route } from "./+types/root";
import stylesheet from "./index.css?url";

export const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: 60000 } },
});

// FIXME: Posthog seems to not work with react router just yet
// const posthogClient = posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
// 	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
// 	person_profiles: "always",
// 	autocapture: false,
// 	capture_pageview: false,
// });

export const links: Route.LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
	{ rel: "stylesheet", href: highlightjs },
];

export const ErrorBoundary = RouteErrorComponent;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const pathname = new URL(request.url).pathname;
	// posthog.capture("$pageview", { $current_url: window.origin + pathname });
	const search = new URLSearchParams({ redirect: pathname });

	// if (!window?.__TAURI_INTERNALS__) {
	// 	if (pathname !== "/login" && !client?.isLoggedIn) {
	// 		throw redirect(`/login?${search.toString()}`);
	// 	}
	// 	return;
	// }

	if (pathname !== "/" && !client?.isLoggedIn) {
		throw redirect(`/?${search.toString()}`);
	}

	// if (pathname === "/splashscreen" || pathname === "/redirect") {
	// 	return;
	// }

	// if (pathname === "/") {
	// 	throw redirect("/login");
	// }

	// if (client?.isLoggedIn) {
	// 	return;
	// }
	// if (pathname !== "/login" && pathname !== "/register" && pathname !== "/oauth-redirect") {
	// 	const search = new URLSearchParams({ redirect: pathname });
	// throw redirect(`/login?${search.toString()}`);
	// }
}

export function Layout(props: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="overflow-hidden">
				{props.children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let unlisten: Promise<() => void>;
		let unlisten2: () => void;
		initializeSettings().then(() => {
			if (!cancelled) {
				unlisten2 = initializeClient();
				unlisten = initializeWindow().then((x) => {
					setLoaded(true);
					return x;
				});
			}
		});

		return () => {
			cancelled = true;
			unlisten?.then((f) => f());
			unlisten2?.();
		};
	}, []);
	return (
		// <PostHogProvider client={posthogClient}>
		<QueryClientProvider client={queryClient}>
			<HistoryProvider>
				{loaded && (
					<ThemeProvier>
						<Outlet />
					</ThemeProvier>
				)}
			</HistoryProvider>
		</QueryClientProvider>
		// </PostHogProvider>
	);
}
