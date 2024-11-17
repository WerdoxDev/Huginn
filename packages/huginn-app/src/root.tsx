import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";
import type { Route } from "./+types.root";

export const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: 60000 } },
});

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
	const [ready, setReady] = useState(false);
	const appWindow = useWindow();

	useEffect(() => {
		initializeSettings().then((x) => setReady(true));
	}, []);

	return (
		// <PostHogProvider client={posthogClient}>
		<QueryClientProvider client={queryClient}>
			<EventProvider>
				<HistoryProvider>
					{ready && (
						<SettingsProvider>
							<APIProvider>
								<WindowProvider>
									<ThemeProvier>
										<ModalProvider>
											<ContextMenuProvider>
												<UserProvider>
													<PresenceProvider>
														<TypingProvider>
															<div
																className={`flex h-full flex-col overflow-hidden ${appWindow.maximized ? "rounded-none" : "rounded-lg"}`}
															>
																{window.location.pathname !== "/splashscreen" && appWindow.environment === "desktop" && <TitleBar />}
																<div className="relative h-full w-full">
																	<Outlet />
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
		//</PostHogProvider>
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
