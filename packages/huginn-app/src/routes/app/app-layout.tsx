import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import StartBackgroundSvg from "@components/StartBackgroundSvg";
import TitleBar from "@components/TitleBar";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { NotificationProvider } from "@contexts/notificationContext";
import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import { dispatchEvent } from "@lib/event-handler";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { initializePresence } from "@stores/presenceStore";
import { initializeReadStates } from "@stores/readStatesStore";
import { initializeTyping } from "@stores/typingStore";
import { initializeUser } from "@stores/userStore";
import { initializeVoice } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { type ReactNode, useEffect } from "react";
import { Outlet } from "react-router";

export default function AppLayout() {
	const authBackground = useStartBackground();
	const huginnWindow = useHuginnWindow();
	const { isMainTransitioning } = useMainViewTransitionState();

	useEffect(() => {
		const unlisten = initializeUser();
		const unlisten2 = initializeReadStates();
		const unlisten3 = initializePresence();
		const unlisten4 = initializeTyping();
		const unlisten5 = initializeVoice();

		return () => {
			unlisten();
			unlisten2();
			unlisten3();
			unlisten4();
			unlisten5();
		};
	}, []);

	return (
		<ContextMenuProvider>
			<NotificationProvider>
				<MainRenderer>
					<div
						className={clsx("absolute inset-0 bg-surface-alt", huginnWindow.environment === "desktop" && !huginnWindow.fullscreen && "top-6")}
						style={isMainTransitioning ? { viewTransitionName: "start" } : undefined}
					>
						<StartBackgroundSvg state={authBackground.state} />
						<Outlet />
					</div>
				</MainRenderer>
			</NotificationProvider>
		</ContextMenuProvider>
	);
}

function MainRenderer(props: { children: ReactNode }) {
	const huginnWindow = useHuginnWindow();

	useEffect(() => {
		if (huginnWindow.environment === "desktop") {
			const unlisten = window.electronAPI.onDeepLink((_, cmd) => {
				dispatchEvent("deep_link", cmd);
			});

			const unlisten2 = window.electronAPI.onMaximizedChanged((_, isMaximized) => {
				huginnWindow.setMaximized(isMaximized);
			});

			const unlisten3 = window.electronAPI.onFullscreenChanged((_, isFullscreen) => {
				huginnWindow.setFullscreen(isFullscreen);
			});

			return () => {
				unlisten();
				unlisten2();
				unlisten3();
			};
		}
	}, []);

	return (
		<div className={clsx("flex h-full flex-col overflow-hidden" /*, huginnWindow.maximized ? "rounded-none" : "rounded-lg"*/)}>
			{window.location.pathname !== "/splashscreen" && huginnWindow.environment === "desktop" && <TitleBar />}
			<div className="relative h-full w-full">
				{props.children}
				{/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
				<ModalsRenderer />
				<ContextMenusRenderer />
			</div>
		</div>
	);
}
