import clsx from "clsx";
import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { useLocation } from "react-router";

export default function RingLink(props: { children?: ReactNode; to: string; className?: string }) {
	const location = useLocation();
	const isActive = useMemo(() => location.pathname.includes(props.to), [location.pathname]);

	return (
		<NavLink
			to={props.to}
			className={clsx(
				"rounded-full uppercase ring-[1.5px] ring-primary",
				props.className,
				isActive ? "bg-primary text-text" : "text-text/70 hover:bg-primary hover:text-text/100",
			)}
		>
			{props.children}
		</NavLink>
	);
}
