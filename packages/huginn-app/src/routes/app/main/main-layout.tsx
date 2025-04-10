import GuildsBar from "@components/GuildsBar";
import WebsocketProviders from "@components/websocket/WebsocketProviders";
import { useAuthBackground } from "@contexts/authBackgroundContext";
import { useEffect } from "react";
import { Outlet } from "react-router";

export default function MainLayout() {
	const authBackground = useAuthBackground();

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
