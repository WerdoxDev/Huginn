import GuildsBar from "@components/GuildsBar";
import WebsocketProviders from "@components/websocket/WebsocketProviders";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect } from "react";
import { Outlet, useViewTransitionState } from "react-router";

export default function MainLayout() {
	const authBackground = useStartBackground();
	const { updateModals } = useModals();
	const huginnWindow = useHuginnWindow();
	const isTransitioning = useViewTransitionState("*");

	useEffect(() => {
		// updateModals({ news: { isOpen: true } });

		if (!isTransitioning && huginnWindow.version !== localStorage.getItem("version")) {
			updateModals({ news: { isOpen: true } });
			localStorage.setItem("version", huginnWindow.version);
		}
	}, [isTransitioning]);

	useEffect(() => {
		authBackground.setState(2);
	}, []);

	return (
		<div className="absolute inset-0 overflow-hidden">
			<div className="flex h-full w-full select-none bg-background">
				<WebsocketProviders>
					<GuildsBar />
					<Outlet />
				</WebsocketProviders>
			</div>
		</div>
	);
}
