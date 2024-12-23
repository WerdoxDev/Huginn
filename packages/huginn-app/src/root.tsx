import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { PostHogProvider } from "posthog-js/react";
// import posthog from "posthog-js";
import type { ReactNode } from "react";
import type { Route } from "./+types/root";
import stylesheet from "./index.css?url";

export const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: 60000 } },
});

// FIXME: Posthog seems to note work with react router just yet
// const posthogClient = posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
// 	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
// 	person_profiles: "always",
// 	autocapture: false,
// 	capture_pageview: false,
// });

export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: stylesheet }];

export const ErrorBoundary = RouteErrorComponent;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const pathname = new URL(request.url).pathname;
	// posthog.capture("$pageview", { $current_url: window.origin + pathname });

	if (pathname === "/splashscreen" || pathname === "/redirect") {
		return;
	}

	if (pathname === "/") {
		throw redirect("/login");
	}

	if (client?.isLoggedIn) {
		return;
	}
	if (pathname !== "/login" && pathname !== "/register" && pathname !== "/oauth-redirect") {
		const search = new URLSearchParams({ redirect: pathname });
		throw redirect(`/login?${search.toString()}`);
	}
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
			<body>
				{props.children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	const [settingsLoaded, setSettingsLoaded] = useState(false);

	useEffect(() => {
		initializeSettings().then((x) => setSettingsLoaded(true));
	}, []);

	return (
		// <PostHogProvider client={posthogClient}>
		<QueryClientProvider client={queryClient}>
			<EventProvider>
				<HistoryProvider>
					{settingsLoaded && (
						<SettingsProvider>
							<HuginnWindowProvider>
								<ThemeProvier>
									<Outlet />
								</ThemeProvier>
							</HuginnWindowProvider>
						</SettingsProvider>
					)}
				</HistoryProvider>
			</EventProvider>
		</QueryClientProvider>
		// </PostHogProvider>
	);
}
