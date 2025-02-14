import AuthBackgroundSvg from "@components/AuthBackgroundSvg";
import TitleBar from "@components/TitleBar";
import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import { APIProvider } from "@contexts/apiContext";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext";
import { useEvent } from "@contexts/eventContext";
import { ModalProvider } from "@contexts/modalContext";
import { NotificationProvider } from "@contexts/notificationContext";
import { PresenceProvider } from "@contexts/presenceContext";
import { ReadStateProvider } from "@contexts/readStateContext";
import { TypingProvider } from "@contexts/typingContext";
import { UserProvider } from "@contexts/userContext";
import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { useHuginnWindow } from "@stores/windowStore";
import { listen } from "@tauri-apps/api/event";
import clsx from "clsx";
import { type ReactNode, useEffect, useState } from "react";
import { Outlet } from "react-router";

export default function Layout() {
	const [backgroundState, setBackgroundState] = useState(2);
	const huginnWindow = useHuginnWindow();
	const isTransitioning = useMainViewTransitionState();

	return (
		<APIProvider>
			<ModalProvider>
				<ContextMenuProvider>
					<UserProvider>
						<PresenceProvider>
							<NotificationProvider>
								<ReadStateProvider>
									<TypingProvider>
										<MainRenderer>
											<AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
												<div
													className={clsx("absolute inset-0 bg-secondary", huginnWindow.environment === "desktop" && "top-6")}
													style={isTransitioning ? { viewTransitionName: "auth" } : undefined}
												>
													<AuthBackgroundSvg state={backgroundState} />
													<Outlet />
												</div>
											</AuthBackgroundContext.Provider>
										</MainRenderer>
									</TypingProvider>
								</ReadStateProvider>
							</NotificationProvider>
						</PresenceProvider>
					</UserProvider>
				</ContextMenuProvider>
			</ModalProvider>
		</APIProvider>
	);
}

function MainRenderer(props: { children: ReactNode }) {
	const huginnWindow = useHuginnWindow();
	return (
		<div className={`flex h-full flex-col overflow-hidden ${huginnWindow.maximized ? "rounded-none" : "rounded-lg"}`}>
			{window.location.pathname !== "/splashscreen" && huginnWindow.environment === "desktop" && <TitleBar />}
			<div className="relative h-full w-full">
				{props.children}
				{/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
				{huginnWindow.environment === "desktop" && (
					<>
						{/* <AppMaximizedEvent /> */}
						<AppOpenUrlEvent />
					</>
				)}
				<ModalsRenderer />
				<ContextMenusRenderer />
			</div>
		</div>
	);
}

// function AppMaximizedEvent() {
// 	const dispatch = useWindowDispatch();
// 	const huginnWindow = useWindow();

// 	useEffect(() => {}, []);

// 	return null;
// }

function AppOpenUrlEvent() {
	const { dispatchEvent } = useEvent();
	const huginnWindow = useHuginnWindow();

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
