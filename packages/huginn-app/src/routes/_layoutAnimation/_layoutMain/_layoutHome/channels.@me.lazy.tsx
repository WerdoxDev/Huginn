import { Link, Outlet, createLazyFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me")({
	component: Component,
});

function Component() {
	const params = useParams({ strict: false });
	const dispatch = useModalsDispatch();
	const navigate = useNavigate();

	return params.channelId ? (
		<Outlet />
	) : (
		<div className="flex h-full flex-col">
			<div className="flex h-full flex-col items-center justify-center gap-y-5">
				<div className="flex max-w-md flex-col items-center text-center text-text">
					<IconFa6SolidCrow className="hover:-rotate-12 mb-2.5 size-20 text-accent transition-transform hover:scale-105 active:rotate-6" />
					<div className="mb-2.5 font-bold text-2xl">Welcome to Huginn</div>
					<div>
						Start by adding your friends in the{" "}
						<Link to="/friends" className="font-bold text-accent">
							FRIENDS
						</Link>{" "}
						section or select one of these <span className="font-semibold text-text/80">Quick Actions</span>!
					</div>
				</div>
				<div className="flex gap-2">
					<QuickActionButton onClick={() => dispatch({ createDM: { isOpen: true } })}>Create Direct Message</QuickActionButton>
					<QuickActionButton onClick={() => navigate({ to: "/friends" })}>Add a Friend</QuickActionButton>
				</div>
			</div>
			<div className="flex h-16 w-full flex-shrink-0 bg-background" />
		</div>
	);
}
