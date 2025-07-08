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

export default function DropdownMenu(props: MenuProps<"div">) {
	return <Menu {...props} as="div" className={clsx("relative", props.className)} />;
}

function Button<T extends ElementType>(props: MenuButtonProps<T>) {
	// @ts-ignore
	return <MenuButton {...props} className={clsx("cursor-pointer", props.className)} />;
}

function Items(props: MenuItemsProps) {
	return (
		<MenuItems
			{...props}
			modal={false}
			anchor={false}
			portal={false}
			transition
			className={clsx(
				"-translate-x-1/2 absolute left-1/2 z-998 flex min-w-28 flex-col gap-y-0.5 rounded-lg bg-zinc-900 p-2.5 shadow-lg outline-hidden transition data-closed:scale-95 data-closed:opacity-0",
				"bottom-[calc(100%+var(--anchor-gap))]",
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
				"flex cursor-pointer items-center justify-between gap-x-5 text-nowrap rounded-sm px-2 py-1.5 text-start text-sm text-white/90 outline-hidden hover:bg-surface-alt",
				props.className,
			)}
		>
			{props.label}
			{props.children as ReactNode}
		</MenuItem>
	);
}

function Divider() {
	return <div className="mx-2 my-2 h-px bg-surface" />;
}

DropdownMenu.Divider = Divider;
DropdownMenu.Button = Button;
DropdownMenu.Items = Items;
DropdownMenu.Item = Item;
