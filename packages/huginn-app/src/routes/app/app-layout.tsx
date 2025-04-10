import AuthBackgroundSvg from "@components/AuthBackgroundSvg";
import TitleBar from "@components/TitleBar";
import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import { useAuthBackground } from "@contexts/authBackgroundContext";
import { NotificationProvider } from "@contexts/notificationContext";
import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import { dispatchEvent } from "@lib/eventHandler";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { initializePresence } from "@stores/presenceStore";
import { initializeReadStates } from "@stores/readStatesStore";
import { initializeTyping } from "@stores/typingStore";
import { initializeUser } from "@stores/userStore";
import { initializeVoice } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { type ReactNode, useEffect, useState } from "react";
import { Outlet } from "react-router";

export default function AppLayout() {
	const authBackground = useAuthBackground();
	const huginnWindow = useHuginnWindow();
	const isTransitioning = useMainViewTransitionState();
	const queryClient = useQueryClient();

	useEffect(() => {
		const unlisten = initializeUser();
		const unlisten2 = initializeReadStates();
		const unlisten3 = initializePresence();
		const unlisten4 = initializeTyping();
		const unlisten5 = initializeVoice(queryClient);

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
						className={clsx("absolute inset-0 bg-secondary", huginnWindow.environment === "desktop" && "top-6")}
						style={isTransitioning ? { viewTransitionName: "auth" } : undefined}
					>
						<AuthBackgroundSvg state={authBackground.state} />
						<Outlet />
					</div>
				</MainRenderer>
			</NotificationProvider>
		</ContextMenuProvider>
	);
}

function MainRenderer(props: { children: ReactNode }) {
	const huginnWindow = useHuginnWindow();

	const { updateModals } = useModals();

	useEffect(() => {
		// dispatch({ news: { isOpen: true } });
	}, []);

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

function AppOpenUrlEvent() {
	const huginnWindow = useHuginnWindow();

	useEffect(() => {
		if (huginnWindow.environment === "desktop") {
			//TODO: MIGRATION
			// const unlisten = listen("deep-link://new-url", (event) => {
			// 	dispatchEvent("open_url", event.payload as string[]);
			// });
			// return () => {
			// 	unlisten.then((f) => f());
			// };
		}
	}, []);

	return null;
}
