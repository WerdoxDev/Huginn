import { Tab } from "@headlessui/react";
import type { ReactNode } from "@tanstack/react-router";
import clsx from "clsx";
import { Fragment } from "react/jsx-runtime";

export default function FriendsTabItem(props: { children?: ReactNode }) {
	return (
		<Tab as={Fragment}>
			{({ selected }) => (
				<button
					className={clsx(
						"rounded-md px-2 py-0.5 outline-none",
						selected ? "text-text pointer-events-none bg-white/10" : "text-text/50 hover:text-text/100 hover:bg-white/5",
					)}
					type="button"
				>
					{props.children}
				</button>
			)}
		</Tab>
	);
}
