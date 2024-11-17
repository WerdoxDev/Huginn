import clsx from "clsx";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

export default function LinkButton(props: {
	className?: string;
	to?: string;
	href?: string;
	preload?: false | "intent";
	children?: ReactNode;
	onClick?: () => void;
}) {
	return props.to ? (
		<div className={clsx("w-max select-none text-accent", props.className)}>
			<NavLink className="hover:underline" to={props.to}>
				{props.children}
			</NavLink>
		</div>
	) : props.href ? (
		<a className={clsx("select-none text-accent hover:underline", props.className)} href={props.href} target="_blank" rel="noreferrer">
			{props.children}
		</a>
	) : (
		<button className={clsx("select-none text-accent hover:underline", props.className)} type="button" onClick={props.onClick}>
			{props.children}
		</button>
	);
}
