import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { DropdownItem } from "@/types";

const DropdownContext = createContext<{
	id: string;
	selected?: DropdownItem;
	defaultValue?: DropdownItem;
	onChange?: (value: DropdownItem) => void;
}>({
	id: "",
});

export default function HuginnDropdown(props: {
	children?: ReactNode;
	className?: string;
	defaultValue?: DropdownItem;
	onChange?: (value: DropdownItem) => void;
	forceSelected?: DropdownItem;
}) {
	const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));
	const [selected, setSelected] = useState<DropdownItem | undefined>(props.forceSelected ?? props.defaultValue);

	function onChange(value: DropdownItem) {
		if (!props.forceSelected) {
			setSelected(value);
		}
		props.onChange?.(value);
	}

	useEffect(() => {
		if (props.forceSelected) {
			setSelected(props.forceSelected);
		}
	}, [props.forceSelected]);

	useEffect(() => {
		if (!selected || selected.value !== props.defaultValue?.value) {
			setSelected(props.defaultValue);
		}
	}, [props.defaultValue]);

	return (
		<DropdownContext.Provider value={{ id: id, selected: selected, onChange: onChange, defaultValue: props.defaultValue }}>
			<div className={clsx("flex flex-col", props.className)}>{props.children}</div>
		</DropdownContext.Provider>
	);
}

function List(props: { className?: string; children?: ReactNode }) {
	const dropdownContext = useContext(DropdownContext);

	return (
		<div className={clsx("w-52 rounded-lg bg-surface-alt", props.className)}>
			<Listbox value={dropdownContext.selected} onChange={dropdownContext.onChange}>
				{({ open, value }) => (
					<div>
						<ListboxButton className="relative flex w-full cursor-pointer select-none items-center gap-x-1.5 overflow-hidden p-2 text-white outline-hidden">
							{value?.icon}
							<span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">{value?.text}</span>
							<IconMingcuteDownFill className={clsx("ml-auto h-6 w-6 shrink-0 text-primary-500 transition-transform", open && "rotate-180")} />
						</ListboxButton>
						{props.children}
					</div>
				)}
			</Listbox>
		</div>
	);
}

function ItemsWrapper(props: { className?: string; children?: ReactNode }) {
	return (
		<ListboxOptions
			modal={false}
			anchor="bottom"
			transition
			className={clsx(
				"scroll-alternative2 !overflow-y-scroll flex flex-col gap-y-0.5 rounded-lg bg-surface-alt p-1 pr-0 outline outline-primary-800 transition [--anchor-gap:0.25rem] [--anchor-padding:1rem] data-closed:translate-y-5 data-closed:opacity-0",
				props.className,
			)}
		>
			{props.children}
		</ListboxOptions>
	);
}

function Item(props: { item: DropdownItem; children?: ReactNode }) {
	return (
		<ListboxOption
			value={props.item}
			className="group flex cursor-pointer items-center gap-x-1.5 rounded-md p-1.5 text-white data-focus:bg-surface data-selected:bg-surface/50"
		>
			{props.item.icon}
			{props.item.text}
			{props.children}
			<IconMingcuteCheckFill className="invisible ml-auto size-5 shrink-0 text-primary-500 group-data-selected:visible" />
		</ListboxOption>
	);
}

function Label(props: { children?: ReactNode }) {
	const dropdownContext = useContext(DropdownContext);

	return (
		<label htmlFor={dropdownContext.id} className="mb-2 select-none font-medium text-text text-xs uppercase opacity-90">
			{props.children}
		</label>
	);
}

HuginnDropdown.Label = Label;
HuginnDropdown.List = List;
HuginnDropdown.ItemsWrapper = ItemsWrapper;
HuginnDropdown.Item = Item;
