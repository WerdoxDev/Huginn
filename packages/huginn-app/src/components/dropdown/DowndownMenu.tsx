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
import { useEffect, type ElementType, type ReactNode } from "react";

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
            "z-998 outline-hidden data-closed:scale-95 data-closed:opacity-0 absolute left-1/2 flex min-w-28 -translate-x-1/2 flex-col gap-y-0.5 rounded-lg bg-zinc-900 p-2.5 shadow-lg transition",
            "bottom-[calc(100%+var(--anchor-gap))]",
            props.className,
         )}
      />
   );
}

function Item(props: MenuItemProps<"button"> & { label: string; color?: "default" | "negative" }) {
   return (
      <MenuItem
         as="button"
         {...props}
         onClick={(e) => {
            // VERY WEIRD BUG THAT IS ONLY FIXED WITH THIS
            if (e.detail === 0) {
               props.onClick?.(e);
            }
         }}
         className={clsx(
            "outline-hidden flex cursor-pointer items-center justify-between gap-x-5 text-nowrap rounded-sm px-2 py-1.5 text-start text-sm",
            !props.color || props.color === "default"
               ? "hover:bg-surface-alt text-white/90"
               : props.color === "negative" && "text-negative-100 hover:bg-negative-100/10",
            props.className,
         )}
      >
         {props.label}
         {props.children as ReactNode}
      </MenuItem>
   );
}

function Divider() {
   return <div className="bg-surface mx-2 my-2 h-px" />;
}

DropdownMenu.Divider = Divider;
DropdownMenu.Button = Button;
DropdownMenu.Items = Items;
DropdownMenu.Item = Item;
