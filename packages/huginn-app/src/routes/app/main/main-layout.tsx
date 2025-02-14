import GuildsBar from "@components/GuildsBar";
import WebsocketProviders from "@components/websocket/WebsocketProviders";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext";
import { useContext, useEffect } from "react";
import { Outlet } from "react-router";

export default function Layout() {
	const { setState: setBackgroundState } = useContext(AuthBackgroundContext);

	useEffect(() => {
		setBackgroundState(2);
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
