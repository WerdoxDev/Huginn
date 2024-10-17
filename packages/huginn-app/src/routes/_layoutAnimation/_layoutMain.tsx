import GuildsBar from "@components/GuildsBar.tsx";
import WebsocketProviders from "@components/websocket/WebsocketProviders.tsx";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext.ts";
import { ChannelScrollProvider } from "@contexts/channelScrollContext.tsx";
import { PresenceProvider } from "@contexts/presenceContext.tsx";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useContext, useEffect } from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain")({
	component: LayoutMain,
});

function LayoutMain() {
	const { setState: setBackgroundState } = useContext(AuthBackgroundContext);

	useEffect(() => {
		setBackgroundState(2);
	}, []);

	return (
		<div className="absolute inset-0 overflow-hidden">
			<div className="flex h-full w-full select-none bg-background">
				<WebsocketProviders>
					<ChannelScrollProvider>
						<GuildsBar />
						<Outlet />
					</ChannelScrollProvider>
				</WebsocketProviders>
			</div>
		</div>
	);
}
