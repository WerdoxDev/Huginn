import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Outlet } from "react-router";

export default function Layout() {
	const [backgroundState, setBackgroundState] = useState(2);
	const appWindow = useWindow();
	const isTransitioning = useMainViewTransitionState();

	return (
		<APIProvider>
			<ModalProvider>
				<ContextMenuProvider>
					<UserProvider>
						<PresenceProvider>
							<TypingProvider>
								<MainRenderer>
									<AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
										<div
											className={clsx("absolute inset-0 bg-secondary", appWindow.environment === "desktop" && "top-6")}
											style={isTransitioning ? { viewTransitionName: "auth" } : undefined}
										>
											<AuthBackgroundSvg state={backgroundState} />
											<Outlet />
										</div>
									</AuthBackgroundContext.Provider>
								</MainRenderer>
							</TypingProvider>
						</PresenceProvider>
					</UserProvider>
				</ContextMenuProvider>
			</ModalProvider>
		</APIProvider>
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
