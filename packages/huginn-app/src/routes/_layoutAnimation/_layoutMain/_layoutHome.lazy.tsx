import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_layoutAnimation/_layoutMain/_layoutHome")({
	component: LayoutHome,
	errorComponent: RouteErrorComponent,
});

function LayoutHome() {
	const client = useClient();
	const { data } = useSuspenseQuery(getChannelsOptions(client, "@me"));

	const { user } = useUser();

	return (
		//TODO: Abstract the 2 (navigation & content) parts to a central component for later use
		<div className="flex h-full w-full flex-col overflow-hidden">
			<div className="flex h-full">
				<div className="flex w-64 flex-shrink-0 flex-col">
					<HomeSidebar channels={data} />
					{user && <UserInfo user={user} />}
				</div>
				<div className="relative w-full overflow-hidden bg-tertiary">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
