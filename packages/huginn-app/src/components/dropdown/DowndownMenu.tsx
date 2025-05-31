import {
	Menu,
	MenuButton,
	type MenuButtonProps,
	MenuItem,
	type MenuItemProps,
	MenuItems,
	type MenuItemsProps,
	type MenuProps,
} from "@headlessui/react";
import clsx from "clsx";
import type { ElementType, ReactNode } from "react";

export default function DropdownMenu(props: MenuProps) {
	return <Menu {...props} />;
}

function Button<T extends ElementType>(props: MenuButtonProps<T>) {
	// @ts-ignore
	return <MenuButton {...props} />;
}

function Items(props: MenuItemsProps) {
	return (
		<MenuItems
			{...props}
			modal={false}
			transition
			className={clsx(
				"z-20 flex min-w-28 flex-col gap-y-0.5 rounded-lg bg-zinc-900 p-2.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0",
				props.className,
			)}
		/>
	);
}

function Item(props: MenuItemProps<"button"> & { label: string }) {
	return (
		<MenuItem
			as={"button"}
			{...props}
			className={clsx(
				"flex items-center justify-between gap-x-5 rounded px-2 py-1.5 text-start text-sm text-white/90 outline-none hover:bg-secondary",
				props.className,
			)}
		>
			{props.label}
			{props.children as ReactNode}
		</MenuItem>
	);
}

function Divider() {
	return <div className="mx-2 my-2 h-px bg-background" />;
}

DropdownMenu.Divider = Divider;
DropdownMenu.Button = Button;
DropdownMenu.Items = Items;
DropdownMenu.Item = Item;
