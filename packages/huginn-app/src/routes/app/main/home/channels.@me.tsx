import HuginnIcon from "@components/HuginnIcon";
import QuickActionButton from "@components/button/QuickActionButton";
import { useModals } from "@stores/modalsStore";
import { NavLink, useNavigate } from "react-router";

export default function Component() {
	const { updateModals } = useModals();
	const navigate = useNavigate();

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-full flex-col items-center justify-center gap-y-5">
				<div className="flex max-w-md flex-col items-center text-center text-text">
					<div className="mb-2.5 rounded-xl bg-background p-5 shadow-lg">
						<HuginnIcon
							outlined
							overrideTheme="text"
							className="hover:-rotate-12 size-20 text-accent transition-transform hover:scale-105 active:rotate-6"
						/>
					</div>
					<div className="mb-2.5 font-bold text-2xl">Welcome to Huginn</div>
					<div>
						Start by adding your friends in the{" "}
						<NavLink to="/friends" className="font-bold text-accent">
							FRIENDS
						</NavLink>{" "}
						section or select one of these <span className="font-semibold text-text/80">Quick Actions</span>!
					</div>
				</div>
				<div className="flex gap-2">
					<QuickActionButton onClick={() => updateModals({ createDM: { isOpen: true } })}>Create Direct Message</QuickActionButton>
					<QuickActionButton onClick={() => navigate("/friends")}>Add a Friend</QuickActionButton>
				</div>
			</div>
			<div className="flex h-16 w-full flex-shrink-0 bg-background" />
		</div>
	);
}
