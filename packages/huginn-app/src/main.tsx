import { APIProvider } from "@contexts/apiContext";
import { EventProvider } from "@contexts/eventContext";
import { SettingsProvider, initializeSettings } from "@contexts/settingsContext";
import { WindowProvider } from "@contexts/windowContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { createRoot } from "react-dom/client";
import "./index.css";
import DefaultNotFound from "@components/DefaultNotFound";
import { PresenceProvider } from "@contexts/presenceContext";
import { createRouter } from "@tanstack/react-router";
import HuginnRouterProvider from "./HuginnRouterProvider";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: 60000 } },
});

const posthogClient = posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
	person_profiles: "always",
	autocapture: false,
	capture_pageview: false,
});

export const router = createRouter({
	routeTree,
	// defaultPreload: "intent",
	// defaultPreloadDelay: 200,
	defaultPreloadStaleTime: 0,

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	context: { queryClient, client: undefined!, posthog: posthogClient! },
	defaultNotFoundComponent: DefaultNotFound,
	unmaskOnReload: true,
	// defaultGcTime: 0,
	// defaultErrorComponent: DefaultError,
});

await initializeSettings();

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
	// <StrictMode>
	<PostHogProvider client={posthogClient}>
		<QueryClientProvider client={queryClient}>
			<EventProvider>
				<SettingsProvider>
					<APIProvider>
						<WindowProvider>
							<HuginnRouterProvider router={router} />
						</WindowProvider>
					</APIProvider>
				</SettingsProvider>
			</EventProvider>
		</QueryClientProvider>
	</PostHogProvider>,
	// </StrictMode>,
);
