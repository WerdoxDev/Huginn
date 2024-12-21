import { Outlet } from "react-router";

export default function Layout() {
	const { setState: setBackgroundState } = useContext(AuthBackgroundContext);

	useEffect(() => {
		setBackgroundState(2);
	}, []);

	return (
		<div className="absolute inset-0 overflow-hidden">
			<div className="flex h-full w-full select-none bg-background">
				<ChannelMetaProvider>
					<WebsocketProviders>
						<GuildsBar />
						<Outlet />
					</WebsocketProviders>
				</ChannelMetaProvider>
			</div>
		</div>
	);
}
