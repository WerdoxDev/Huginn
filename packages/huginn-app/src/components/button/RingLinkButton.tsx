import clsx from "clsx";
import type { ReactNode } from "react";
import { type LinkProps, NavLink } from "react-router";
import { useLocation } from "react-router";

export default function RingLink(props: LinkProps & { to: string }) {
	const location = useLocation();
	const isActive = useMemo(() => location.pathname.includes(props.to), [location.pathname]);

	return (
		<NavLink
			{...props}
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
