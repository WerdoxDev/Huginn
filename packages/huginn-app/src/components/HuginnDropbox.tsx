import type { DropboxItem } from "@/types.ts";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { filterChildrenOfType } from "@lib/utils.ts";
import { clsx } from "@nick/clsx";
import type { ReactNode } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export default function HuginnDropbox(props: {
	items: DropboxItem[];
	defaultIndex?: number;
	children?: ReactNode;
	className?: string;
	onChange?: (value: DropboxItem) => void;
	selected?: DropboxItem;
}) {
	const [selected, setSelected] = useState(props.selected ?? props.items[props.defaultIndex ?? 0]);

	const filteredChildren = useMemo(() => {
		return {
			label: filterChildrenOfType(props.children, Label),
		};
	}, [props.children]);

	function onChange(value: DropboxItem) {
		if (!props.selected) {
			setSelected(value);
		}
		props.onChange?.(value);
	}

	useEffect(() => {
		if (props.selected) {
			setSelected(props.selected);
		}
	}, [props.selected]);

	return (
		<div className={clsx("flex flex-col", props.className)}>
			{filteredChildren.label && <HuginnDropbox.Label skipRender>{filteredChildren.label}</HuginnDropbox.Label>}
			<div className="bg-secondary w-52 rounded-lg">
				<Listbox value={selected} onChange={onChange}>
					{({ open }) => (
						<>
							<ListboxButton className="relative flex w-full items-center justify-between p-2.5 text-white">
								{selected.name}
								<IconMingcuteDownFill className={clsx("text-accent h-6 w-6 transition-transform", open && "rotate-180")} />
							</ListboxButton>
							<ListboxOptions
								anchor="bottom"
								transition
								className="bg-secondary flex w-52 cursor-pointer flex-col rounded-lg p-1.5 shadow-md transition [--anchor-gap:0.25rem] data-[closed]:translate-y-5 data-[closed]:opacity-0"
							>
								{props.items.map((item) => (
									<ListboxOption
										key={item.id}
										value={item}
										className="hover:bg-background group flex items-center gap-x-1.5 rounded-md p-1.5 text-white"
									>
										<IconMingcuteCheckFill className="invisible size-5 group-data-[selected]:visible" />
										{item.icon}
										{item.name}
									</ListboxOption>
								))}
							</ListboxOptions>
						</>
					)}
				</Listbox>
			</div>
		</div>
	);
}

function Label(props: { children?: ReactNode; skipRender?: boolean }) {
	return !props.skipRender ? (
		<label className="mb-2 select-none font-medium text-text text-xs uppercase opacity-90">{props.children}</label>
	) : (
		props.children
	);
}

HuginnDropbox.Label = Label;
