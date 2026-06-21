import { Drawer, Menu } from "@base-ui/react";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer"; // 👈 shared
import { useIsMobile } from "@hooks/useIsMobile";
import { useStackBackHandler } from "@hooks/useStackBackHandler";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, isValidElement, type ReactNode, useContext, useState } from "react";

type Tone = "default" | "negative";

const MenuContext = createContext<{ onClose?: () => void; isMobile: boolean } | null>(undefined!);

const popupClass = clsx(
   "flex flex-col rounded-lg bg-zinc-900 p-2 shadow-lg outline-hidden",
   "transition-[opacity_transform] duration-200",
   "data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-sm",
   "data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-sm",
);

export function HuginnMenu(props: Menu.Root.Props) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));
   const [isOpen, setIsOpen] = useState(false);
   const isMobile = useIsMobile();

   useStackBackHandler(`menu-${id}`, () => setIsOpen(false), isOpen);

   const children = (
      <MenuContext.Provider value={{ onClose: () => setIsOpen(false), isMobile: isMobile }}>{props.children as ReactNode}</MenuContext.Provider>
   );

   if (isMobile) {
      return (
         <Drawer.Root open={isOpen} onOpenChange={setIsOpen} modal={true} {...(props as Drawer.Root.Props)}>
            {children}
         </Drawer.Root>
      );
   }
   return (
      <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={true} {...props}>
         {children}
      </Menu.Root>
   );
}

function Trigger(props: (Menu.Trigger.Props | Drawer.Trigger.Props) & { asChild?: boolean }) {
   const { className, children, asChild, ...rest } = props;
   const isMobile = useIsMobile();

   if (asChild && isValidElement(children)) {
      if (isMobile) {
         return (
            <Drawer.Trigger
               {...(rest as Drawer.Trigger.Props)}
               nativeButton={false}
               className={clsx("cursor-pointer", className)}
               render={children}
            />
         );
      }

      return <Menu.Trigger {...(rest as Menu.Trigger.Props)} nativeButton={false} className={clsx("cursor-pointer", className)} render={children} />;
   }

   if (isMobile) {
      return (
         <Drawer.Trigger {...(rest as Drawer.Trigger.Props)} className={clsx("cursor-pointer", className)} render={props.render}>
            {children}
         </Drawer.Trigger>
      );
   }

   return (
      <Menu.Trigger {...(rest as Menu.Trigger.Props)} className={clsx("cursor-pointer", className)} render={props.render}>
         {children}
      </Menu.Trigger>
   );
}

function Content(
   props: Menu.Popup.Props & {
      side?: Menu.Positioner.Props["side"];
      align?: Menu.Positioner.Props["align"];
      sideOffset?: number;
      alignOffset?: number;
   },
) {
   const context = useContext(MenuContext)!;

   if (context.isMobile) {
      return (
         <Drawer.Portal keepMounted={false}>
            <DrawerBackdrop forceRender />
            <DrawerPopup className={typeof props.className === "string" ? props.className : undefined}>{props.children}</DrawerPopup>
         </Drawer.Portal>
      );
   }

   return (
      <Menu.Portal keepMounted={false}>
         <Menu.Positioner side={props.side} align={props.align} sideOffset={props.sideOffset} alignOffset={props.alignOffset}>
            <Menu.Popup className={clsx(popupClass, props.className)}>{props.children}</Menu.Popup>
         </Menu.Positioner>
      </Menu.Portal>
   );
}

function Item(props: { onClick?: () => void; label?: string; color?: Tone; endSlot?: ReactNode; className?: string; disabled?: boolean }) {
   const context = useContext(MenuContext)!;

   function handleClick() {
      if (props.disabled) return;
      props.onClick?.();
      context.onClose?.();
   }

   const itemClass = clsx(
      "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none",
      context.isMobile && "px-3 py-3",
      "data-disabled:cursor-not-allowed data-disabled:text-white/50",
      (!props.color || props.color === "default") &&
         "data-highlighted:bg-surface-alt active:bg-surface-alt text-white/90 data-disabled:text-white/50",
      props.color === "negative" &&
         "text-negative-100 data-highlighted:bg-negative-100/10 active:bg-negative-100/10 data-disabled:text-negative-100/50",
      props.className,
   );

   if (context.isMobile) {
      return (
         <button type="button" disabled={props.disabled} onClick={handleClick} className={itemClass}>
            <div className="flex w-full items-center justify-between gap-x-3">
               <div className="truncate">{props.label}</div>
               <div className="flex items-center gap-x-1">{props.endSlot}</div>
            </div>
         </button>
      );
   }

   return (
      <Menu.Item closeOnClick={false} onClick={handleClick} label={props.label} disabled={props.disabled} className={itemClass}>
         <div className="flex w-full items-center justify-between gap-x-3">
            <div className="truncate">{props.label}</div>
            <div className="flex items-center gap-x-1">{props.endSlot}</div>
         </div>
      </Menu.Item>
   );
}

function Separator(props: { className?: string }) {
   return <Menu.Separator className={clsx("bg-surface mx-2 my-2 h-px", props.className)} />;
}

function SubmenuRoot(props: Menu.SubmenuRoot.Props) {
   return <Menu.SubmenuRoot {...props} />;
}

function SubmenuTrigger(props: {
   onClick?: () => void;
   label?: string;
   color?: Tone;
   endSlot?: ReactNode;
   disabled?: boolean;
   className?: string;
   children?: ReactNode;
}) {
   const context = useContext(MenuContext)!;

   const triggerClass = clsx(
      "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none",
      context.isMobile && "px-3 py-3",
      "data-disabled:cursor-not-allowed data-disabled:text-white/50",
      (!props.color || props.color === "default") &&
         "data-highlighted:bg-surface-alt active:bg-surface-alt text-white/90 data-highlighted:text-white/90",
      props.color === "negative" &&
         "text-negative-100 data-highlighted:bg-negative-100/10 active:bg-negative-100/10 data-disabled:text-negative-100/50",
      props.className,
   );

   const triggerContent = (
      <span className="flex w-full items-center justify-between gap-x-3">
         <span className="truncate">{props.children}</span>
         <span className="flex items-center gap-x-1 text-white/70">
            {props.endSlot}
            <IconMingcuteRightLine className="size-5 text-white/80" />
         </span>
      </span>
   );

   if (context.isMobile) {
      return (
         <Drawer.Trigger disabled={props.disabled} onClick={props.onClick} className={triggerClass}>
            {triggerContent}
         </Drawer.Trigger>
      );
   }

   return (
      <Menu.SubmenuTrigger
         onClick={props.onClick}
         label={props.label}
         openOnHover={true}
         delay={0}
         closeDelay={100}
         disabled={props.disabled}
         className={triggerClass}
      >
         {triggerContent}
      </Menu.SubmenuTrigger>
   );
}

function Submenu(props: { label: ReactNode; children?: ReactNode; color?: Tone; disabled?: boolean; endSlot?: ReactNode }) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));
   const context = useContext(MenuContext)!;
   const [isOpen, setIsOpen] = useState(false);

   useStackBackHandler(`menu-${id}`, () => setIsOpen(false), isOpen);

   function handleClose() {
      setIsOpen(false);
      context.onClose?.();
   }

   const children = (
      <MenuContext.Provider value={{ onClose: handleClose, isMobile: context.isMobile }}>{props.children as ReactNode}</MenuContext.Provider>
   );

   if (context.isMobile) {
      return (
         <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
            <SubmenuTrigger color={props.color} disabled={props.disabled} endSlot={props.endSlot}>
               {props.label}
            </SubmenuTrigger>
            <Drawer.Portal>
               <DrawerBackdrop />
               <DrawerPopup>{children}</DrawerPopup>
            </Drawer.Portal>
         </Drawer.Root>
      );
   }

   return (
      <Menu.SubmenuRoot>
         <SubmenuTrigger
            color={props.color}
            disabled={props.disabled}
            endSlot={props.endSlot}
            label={typeof props.label === "string" ? props.label : undefined}
         >
            {props.label}
         </SubmenuTrigger>
         <Content side="right" align="start" sideOffset={12} alignOffset={-8}>
            {children}
         </Content>
      </Menu.SubmenuRoot>
   );
}

HuginnMenu.Trigger = Trigger;
HuginnMenu.Content = Content;
HuginnMenu.Item = Item;
HuginnMenu.Separator = Separator;
HuginnMenu.SubmenuRoot = SubmenuRoot;
HuginnMenu.SubmenuTrigger = SubmenuTrigger;
HuginnMenu.Submenu = Submenu;
