import {
   Menu,
   MenuButton,
   type MenuButtonProps,
   MenuItem,
   type MenuItemProps,
   MenuItems,
   type MenuItemsProps,
   type MenuProps,
   Transition,
} from "@headlessui/react";
import { omit } from "@huginn/shared";
import clsx from "clsx";
import { createContext, useContext, useEffect, useRef, useState, type ElementType, type ReactElement, type ReactNode, type RefObject } from "react";

const DropdownContext = createContext<{
   isOpen: boolean;
   setIsOpen: (_: boolean) => void;
   itemsRef?: RefObject<HTMLDivElement | null>;
   buttonRef?: RefObject<HTMLButtonElement | null>;
}>({
   isOpen: false,
   setIsOpen: (_: boolean) => {},
});

export default function DropdownMenu(props: MenuProps<"div"> & { onOpenChanged?: (isOpen: boolean) => void }) {
   const [isOpen, setIsOpen] = useState(false);
   const itemsRef = useRef<HTMLDivElement>(null);
   const buttonRef = useRef<HTMLButtonElement>(null);

   useEffect(() => {
      const controller = new AbortController();

      document.addEventListener(
         "mousedown",
         (e) => {
            if (
               buttonRef.current &&
               itemsRef.current &&
               !itemsRef.current.contains(e.target as HTMLElement) &&
               !buttonRef.current.contains(e.target as HTMLElement)
            ) {
               setIsOpen(false);
               console.log("SET FALSE");
            }
         },
         { signal: controller.signal },
      );
      //
      return () => {
         controller.abort();
      };
   }, []);

   useEffect(() => {
      props.onOpenChanged?.(isOpen);
   }, [isOpen]);

   return (
      <DropdownContext.Provider value={{ isOpen, setIsOpen, itemsRef, buttonRef }}>
         <Menu {...props} as="div" className={clsx("relative", props.className)} />
      </DropdownContext.Provider>
   );
}

function Button<T extends ElementType>(
   props: Omit<MenuButtonProps<T>, "children"> & { className?: string; children?: ReactNode | ((bags: { open: boolean }) => ReactElement) },
) {
   const context = useContext(DropdownContext);

   return (
      <MenuButton
         {...props}
         onClick={() => {
            context.setIsOpen(!context.isOpen);
            props.onClick?.();
         }}
         ref={context.buttonRef}
         className={clsx("cursor-pointer", props.className)}
      >
         {typeof props.children === "function" ? props.children({ open: context.isOpen }) : props.children}
      </MenuButton>
   );
}

function Items(props: MenuItemsProps<"div"> & { children?: ReactNode | ((bags: { open: boolean }) => ReactElement) }) {
   const context = useContext(DropdownContext);

   return (
      <Transition show={context.isOpen}>
         <MenuItems
            {...props}
            static
            as={"div"}
            ref={context.itemsRef}
            className={clsx(
               "z-998 outline-hidden data-closed:scale-95 data-closed:opacity-0 absolute flex min-w-28 flex-col gap-y-0.5 rounded-lg bg-zinc-900 p-2.5 shadow-lg transition",
               props.className,
            )}
         >
            {typeof props.children === "function" ? props.children({ open: context.isOpen }) : props.children}
         </MenuItems>
      </Transition>
   );
}

function Item(props: MenuItemProps<"button"> & { label: string; color?: "default" | "negative" }) {
   const context = useContext(DropdownContext);

   return (
      <MenuItem
         {...omit(props, ["color", "label"])}
         as="button"
         onClick={(e) => {
            // VERY WEIRD BUG THAT IS ONLY FIXED WITH THIS
            if (e.detail === 1) {
               props.onClick?.(e);
               context.setIsOpen(false);
            }
         }}
         disabled={props.disabled}
         className={clsx(
            "outline-hidden data-disabled:cursor-not-allowed data-disabled:hover:!bg-transparent flex cursor-pointer items-center justify-between gap-x-5 text-nowrap rounded-sm px-2 py-1.5 text-start text-sm",
            !props.color || props.color === "default"
               ? "hover:enabled:bg-surface-alt data-disabled:text-white/50 text-white/90"
               : props.color === "negative" && "text-negative-100 hover:enabled:bg-negative-100/10 data-disabled:text-negative-100/50",
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
