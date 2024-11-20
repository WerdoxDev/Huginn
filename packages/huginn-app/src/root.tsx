import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
// import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import type { Route } from "./+types.root";

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

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const pathname = new URL(request.url).pathname;
	posthog.capture("$pageview", { $current_url: window.origin + pathname });

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
							<APIProvider>
								<WindowProvider>
									<ThemeProvier>
										<ModalProvider>
											<ContextMenuProvider>
												<UserProvider>
													<PresenceProvider>
														<TypingProvider>
															<MainRenderer>
																<Outlet />
															</MainRenderer>
														</TypingProvider>
													</PresenceProvider>
												</UserProvider>
											</ContextMenuProvider>
										</ModalProvider>
									</ThemeProvier>
								</WindowProvider>
							</APIProvider>
						</SettingsProvider>
					)}
				</HistoryProvider>
			</EventProvider>
		</QueryClientProvider>
		// </PostHogProvider>
	);
}

function MainRenderer(props: { children: ReactNode }) {
	const appWindow = useWindow();
	return (
		<div className={`flex h-full flex-col overflow-hidden ${appWindow.maximized ? "rounded-none" : "rounded-lg"}`}>
			{window.location.pathname !== "/splashscreen" && appWindow.environment === "desktop" && <TitleBar />}
			<div className="relative h-full w-full">
				{props.children}
				{/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
				{appWindow.environment === "desktop" && (
					<>
						<AppMaximizedEvent />
						<AppOpenUrlEvent />
					</>
				)}
				<ModalsRenderer />
				<ContextMenusRenderer />
			</div>
		</div>
	);
}

function AppMaximizedEvent() {
	const dispatch = useWindowDispatch();
	const huginnWindow = useWindow();

	useEffect(() => {
		if (huginnWindow.environment === "desktop") {
			const appWindow = getCurrentWebviewWindow();
			const unlisten = appWindow.onResized(async () => {
				const appMaximized = await appWindow.isMaximized();
				console.log("CHANGED", appMaximized);
				dispatch({ maximized: appMaximized });
			});

			return () => {
				unlisten.then((f) => f());
			};
		}
	}, []);

	return null;
}

function AppOpenUrlEvent() {
	const { dispatchEvent } = useEvent();
	const huginnWindow = useWindow();

	useEffect(() => {
		if (huginnWindow.environment === "desktop") {
			const unlisten = listen("deep-link://new-url", (event) => {
				dispatchEvent("open_url", event.payload as string[]);
			});

			return () => {
				unlisten.then((f) => f());
			};
		}
	}, []);

	return null;
}