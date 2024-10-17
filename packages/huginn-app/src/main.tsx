import { APIProvider } from "@contexts/apiContext.tsx";
import { EventProvider } from "@contexts/eventContext.tsx";
import { SettingsProvider, initializeSettings } from "@contexts/settingsContext.tsx";
import { WindowProvider } from "@contexts/windowContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { posthog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import HuginnRouterProvider from "@/HuginnRouterProvider.tsx";
import { routeTree } from "@/routeTree.gen.ts";
import DefaultNotFound from "@components/DefaultNotFound.tsx";
import { createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";

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

	// biome-ignore lint/style/noNonNullAssertion: <explanation
	context: { queryClient, client: undefined!, posthog: posthogClient! },
	defaultNotFoundComponent: DefaultNotFound,
	unmaskOnReload: true,
	// defaultGcTime: 0,
	// defaultErrorComponent: DefaultError,
});

await initializeSettings();

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
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
		</PostHogProvider>
	</StrictMode>,
);
