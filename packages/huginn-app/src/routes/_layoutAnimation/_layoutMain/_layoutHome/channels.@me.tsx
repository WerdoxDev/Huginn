import { QuickActionButton } from "@components/button/QuickActionButton";
import { useModalsDispatch } from "@contexts/modalContext";
import { Link, Outlet, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me")({
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
				<div className="text-text flex max-w-md flex-col items-center text-center">
					<IconFa6SolidCrow className="text-accent mb-2.5 size-20 transition-transform hover:-rotate-12 hover:scale-105 active:rotate-6" />
					<div className="mb-2.5 text-2xl font-bold">Welcome to Huginn</div>
					<div>
						Start by adding your friends in the{" "}
						<Link to="/friends" className="text-accent font-bold">
							FRIENDS
						</Link>{" "}
						section or select one of these <span className="text-text/80 font-semibold">Quick Actions</span>!
					</div>
				</div>
				<div className="flex gap-2">
					<QuickActionButton onClick={() => dispatch({ createDM: { isOpen: true } })}>Create Direct Message</QuickActionButton>
					<QuickActionButton onClick={() => navigate({ to: "/friends" })}>Add a Friend</QuickActionButton>
				</div>
			</div>
			<div className="bg-background flex h-16 w-full flex-shrink-0" />
		</div>
	);
}
