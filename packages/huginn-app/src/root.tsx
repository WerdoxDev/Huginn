import { HistoryProvider } from "@contexts/historyContext";
import { initializeClient } from "@stores/apiStore";
import { initializeSettings } from "@stores/settingsStore";
import { ThemeProvider } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { useEffect, useState } from "react";
// import { PostHogProvider } from "posthog-js/react";
// import posthog from "posthog-js";
import { Outlet } from "react-router";

// FIXME: Posthog seems to not work with react router just yet
// const posthogClient = posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
// 	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
// 	person_profiles: "always",
// 	autocapture: false,
// 	capture_pageview: false,
// });

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
				<ThemeProvider>
					<Outlet />
				</ThemeProvider>
			)}
		</HistoryProvider>
		// </PostHogProvider>
	);
}
