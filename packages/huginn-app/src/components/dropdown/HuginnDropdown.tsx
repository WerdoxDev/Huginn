import type { DropboxItem } from "@/types";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { WorkerID, snowflake } from "@huginn/shared";
import type { ReactNode } from "@tanstack/react-router";
import clsx from "clsx";
import { createContext } from "react";

const DropdownContext = createContext<{
	id: string;
	selected?: DropboxItem;
	defaultValue?: DropboxItem;
	onChange?: (value: DropboxItem) => void;
}>({
	id: "",
});

export default function HuginnDropdown(props: {
	children?: ReactNode;
	className?: string;
	defaultValue?: DropboxItem;
	onChange?: (value: DropboxItem) => void;
	forceSelected?: DropboxItem;
}) {
	const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));
	const [selected, setSelected] = useState<DropboxItem | undefined>(props.forceSelected ?? props.defaultValue);

	function onChange(value: DropboxItem) {
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

	return (
		<DropdownContext.Provider value={{ id: id, selected: selected, onChange: onChange, defaultValue: props.defaultValue }}>
			<div className={clsx("flex flex-col", props.className)}>{props.children}</div>
		</DropdownContext.Provider>
	);
}

function List(props: { className?: string; children?: ReactNode }) {
	const dropdownContext = useContext(DropdownContext);

	return (
		<div className={clsx("w-52 rounded-lg bg-secondary", props.className)}>
			<Listbox value={dropdownContext.selected} onChange={dropdownContext.onChange}>
				{({ open, value }) => (
					<>
						<ListboxButton className="relative flex w-full items-center justify-between p-2 text-white outline-none">
							{value?.text}
							<IconMingcuteDownFill className={clsx("h-6 w-6 text-accent transition-transform", open && "rotate-180")} />
						</ListboxButton>
						{props.children}
					</>
				)}
			</Listbox>
		</div>
	);
}

function ItemsWrapper(props: { className?: string; children?: ReactNode }) {
	const dropdownContext = useContext(DropdownContext);

	return (
		<ListboxOptions
			anchor="bottom"
			transition
			className={clsx(
				"flex cursor-pointer flex-col gap-y-0.5 rounded-lg bg-secondary p-1 outline-none transition [--anchor-gap:0.25rem] data-[closed]:translate-y-5 data-[closed]:opacity-0",
				props.className,
			)}
		>
			{props.children}
		</ListboxOptions>
	);
}

function Item(props: { item: DropboxItem; children?: ReactNode }) {
	return (
		<ListboxOption
			value={props.item}
			className="group flex items-center gap-x-1.5 rounded-md p-1.5 text-white data-[focus]:bg-background data-[selected]:bg-background/50"
		>
			{props.item.icon}
			{props.item.text}
			{props.children}
			<IconMingcuteCheckFill className="invisible ml-auto size-5 group-data-[selected]:visible" />
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
