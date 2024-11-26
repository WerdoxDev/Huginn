import { NavLink } from "react-router";

export default function HomeButton() {
	return (
		<NavLink
			to="/channels/@me"
			className="group m-3.5 flex h-12 w-12 cursor-pointer items-center justify-center rounded-3xl bg-text transition-all hover:scale-105 hover:rounded-2xl active:translate-y-0.5"
		>
			<HuginnIcon className="group-hover:-rotate-12 size-8 text-background transition-all group-active:rotate-6" />
		</NavLink>
	);
}
