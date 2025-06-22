import { Tab } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, type ReactNode } from "react";

export default function FriendsTabItem(props: { children?: ReactNode }) {
	return (
		<Tab as={Fragment}>
			{({ selected }) => (
				<button
					className={clsx(
						"rounded-md px-2 py-0.5 outline-hidden",
						selected ? "pointer-events-none bg-white/10 text-text" : "text-text/50 hover:bg-white/5 hover:text-text",
					)}
					type="button"
				>
					{props.children}
				</button>
			)}
		</Tab>
	);
}
