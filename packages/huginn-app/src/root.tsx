import { HistoryProvider } from "@contexts/historyContext";
import { client, initializeClient } from "@stores/apiStore";
import { initializeSettings } from "@stores/settingsStore";
import { ThemeProvier } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { useEffect, useState } from "react";
// import { PostHogProvider } from "posthog-js/react";
// import posthog from "posthog-js";
import { type LoaderFunctionArgs, Outlet, redirect } from "react-router";

// FIXME: Posthog seems to not work with react router just yet
// const posthogClient = posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
// 	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
// 	person_profiles: "always",
// 	autocapture: false,
// 	capture_pageview: false,
// });

export async function rootLoader({ request }: LoaderFunctionArgs) {
	const pathname = new URL(request.url).pathname;
	// posthog.capture("$pageview", { $current_url: window.origin + pathname });
	const search = new URLSearchParams({ redirect: pathname });

	if (pathname !== "/" && pathname !== "/oauth-redirect" && !client?.isLoggedIn) {
		throw redirect(`/?${search.toString()}`);
	}
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
		<HistoryProvider>
			{loaded && (
				<ThemeProvier>
					<Outlet />
				</ThemeProvier>
			)}
		</HistoryProvider>
		// </PostHogProvider>
	);
}
