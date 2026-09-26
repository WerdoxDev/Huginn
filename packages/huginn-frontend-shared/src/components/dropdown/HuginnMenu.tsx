import { Drawer, Menu } from "@base-ui/react";
import clsx from "clsx";
import { createContext, isValidElement, type CSSProperties, type ReactNode, useCallback, useContext, useEffect, useId, useState } from "react";

import useMediaQuery from "../../hooks/useMediaQuery";
import { HuginnDrawerBackdrop, HuginnDrawerPopup, type HuginnOverlayLayerController } from "../overlay/HuginnDrawer";

type MenuTone = "default" | "negative";

const MenuContext = createContext<{
   bottomInset?: CSSProperties["bottom"];
   close: () => void;
   isMobile: boolean;
   layerController?: HuginnOverlayLayerController;
}>(undefined!);

export type HuginnMenuProps = {
   children?: ReactNode | ((state: { open: boolean }) => ReactNode);
   open?: boolean;
   defaultOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   modal?: boolean;
   mobile?: boolean;
   mobileBottomInset?: CSSProperties["bottom"];
   layerController?: HuginnOverlayLayerController;
};

export function HuginnMenu({
   children,
   defaultOpen = false,
   layerController,
   mobile,
   mobileBottomInset,
   modal = true,
   onOpenChange,
   open: controlledOpen,
}: HuginnMenuProps) {
   const [internalOpen, setInternalOpen] = useState(defaultOpen);
   const layerId = useId();
   const viewportIsMobile = useMediaQuery("(max-width: 1023px)");
   const isMobile = mobile ?? viewportIsMobile;
   const open = controlledOpen ?? internalOpen;

   const setOpen = useCallback(
      (nextOpen: boolean) => {
         if (controlledOpen === undefined) setInternalOpen(nextOpen);
         onOpenChange?.(nextOpen);
      },
      [controlledOpen, onOpenChange],
   );

   useEffect(() => {
      if (!isMobile || !open || !layerController) return;
      layerController.register(layerId, () => setOpen(false));
      return () => layerController.unregister(layerId);
   }, [isMobile, layerController, layerId, open, setOpen]);

   const content = (
      <MenuContext.Provider value={{ bottomInset: mobileBottomInset, close: () => setOpen(false), isMobile, layerController }}>
         {typeof children === "function" ? children({ open }) : children}
      </MenuContext.Provider>
   );

   if (isMobile) {
      return (
         <Drawer.Root open={open} modal={modal} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
            {content}
         </Drawer.Root>
      );
   }

   return (
      <Menu.Root open={open} modal={modal} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
         {content}
      </Menu.Root>
   );
}

function Trigger(props: (Menu.Trigger.Props | Drawer.Trigger.Props) & { asChild?: boolean }) {
   const { asChild, children, className, ...rest } = props;
   const context = useContext(MenuContext);

   if (asChild && isValidElement(children)) {
      return context.isMobile ? (
         <Drawer.Trigger {...(rest as Drawer.Trigger.Props)} nativeButton={false} className={clsx("cursor-pointer", className)} render={children} />
      ) : (
         <Menu.Trigger {...(rest as Menu.Trigger.Props)} nativeButton={false} className={clsx("cursor-pointer", className)} render={children} />
      );
   }

   return context.isMobile ? (
      <Drawer.Trigger {...(rest as Drawer.Trigger.Props)} className={clsx("cursor-pointer", className)}>
         {children}
      </Drawer.Trigger>
   ) : (
      <Menu.Trigger {...(rest as Menu.Trigger.Props)} className={clsx("cursor-pointer", className)}>
         {children}
      </Menu.Trigger>
   );
}

function Content({
   align,
   alignOffset,
   children,
   className,
   side,
   sideOffset,
   ...props
}: Menu.Popup.Props & {
   side?: Menu.Positioner.Props["side"];
   align?: Menu.Positioner.Props["align"];
   sideOffset?: number;
   alignOffset?: number;
}) {
   const context = useContext(MenuContext);

   if (context.isMobile) {
      return (
         <Drawer.Portal keepMounted={false}>
            <HuginnDrawerBackdrop bottomInset={context.bottomInset} forceRender />
            <HuginnDrawerPopup bottomInset={context.bottomInset} className={typeof className === "string" ? className : undefined}>
               {children}
            </HuginnDrawerPopup>
         </Drawer.Portal>
      );
   }

   return (
      <Menu.Portal keepMounted={false}>
         <Menu.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} className="z-40">
            <Menu.Popup
               {...props}
               className={clsx(
                  "bg-surface-void flex flex-col rounded-lg p-2 shadow-lg outline-hidden transition-[opacity_transform] duration-200 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-sm data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-sm",
                  className,
               )}
            >
               {children}
            </Menu.Popup>
         </Menu.Positioner>
      </Menu.Portal>
   );
}

function Item({
   children,
   className,
   disabled,
   endSlot,
   label,
   onClick,
   color,
   tone = "default",
}: {
   onClick?: () => void;
   label?: string;
   tone?: MenuTone;
   color?: MenuTone;
   endSlot?: ReactNode;
   children?: ReactNode;
   className?: string;
   disabled?: boolean;
}) {
   const context = useContext(MenuContext);
   const resolvedTone = color ?? tone;
   const itemClass = clsx(
      "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none",
      context.isMobile && "px-3 py-3",
      "data-disabled:cursor-not-allowed data-disabled:text-white/50",
      "disabled:cursor-not-allowed disabled:text-white/50",
      resolvedTone === "default" && "data-highlighted:bg-surface-alt active:bg-surface-alt text-white/90",
      resolvedTone === "negative" && "text-negative-300 data-highlighted:bg-negative-300/10 active:bg-negative-300/10",
      className,
   );
   const content = children ?? (
      <>
         <span className="truncate">{label}</span>
         {endSlot ? <span className="flex items-center gap-x-1">{endSlot}</span> : null}
      </>
   );

   function handleClick() {
      if (disabled) return;
      onClick?.();
      context.close();
   }

   return context.isMobile ? (
      <button type="button" disabled={disabled} onClick={handleClick} className={itemClass}>
         {content}
      </button>
   ) : (
      <Menu.Item closeOnClick={false} onClick={handleClick} label={label} disabled={disabled} className={itemClass}>
         {content}
      </Menu.Item>
   );
}

function Separator({ className }: { className?: string }) {
   const context = useContext(MenuContext);
   return context.isMobile ? (
      <div className={clsx("bg-surface mx-2 my-2 h-px", className)} />
   ) : (
      <Menu.Separator className={clsx("bg-surface mx-2 my-2 h-px", className)} />
   );
}

function ChevronRightIcon({ className }: { className?: string }) {
   return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
         <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   );
}

function SubmenuRoot(props: Menu.SubmenuRoot.Props) {
   return <Menu.SubmenuRoot {...props} />;
}

function SubmenuTrigger({
   children,
   className,
   color,
   disabled,
   endSlot,
   label,
   onClick,
   tone = "default",
}: {
   children?: ReactNode;
   className?: string;
   color?: MenuTone;
   disabled?: boolean;
   endSlot?: ReactNode;
   label?: string;
   onClick?: () => void;
   tone?: MenuTone;
}) {
   const context = useContext(MenuContext);
   const resolvedTone = color ?? tone;
   const triggerClass = clsx(
      "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none",
      context.isMobile && "px-3 py-3",
      "data-disabled:cursor-not-allowed data-disabled:text-white/50",
      resolvedTone === "default" && "data-highlighted:bg-surface-alt active:bg-surface-alt text-white/90",
      resolvedTone === "negative" && "text-negative-300 data-highlighted:bg-negative-300/10 active:bg-negative-300/10",
      className,
   );
   const content = (
      <span className="flex w-full items-center justify-between gap-x-3">
         <span className="truncate">{children ?? label}</span>
         <span className="flex items-center gap-x-1 text-white/70">
            {endSlot}
            <ChevronRightIcon className="size-5 text-white/80" />
         </span>
      </span>
   );

   return context.isMobile ? (
      <Drawer.Trigger disabled={disabled} onClick={onClick} className={triggerClass}>
         {content}
      </Drawer.Trigger>
   ) : (
      <Menu.SubmenuTrigger onClick={onClick} label={label} openOnHover delay={0} closeDelay={100} disabled={disabled} className={triggerClass}>
         {content}
      </Menu.SubmenuTrigger>
   );
}

function Submenu({
   children,
   color,
   disabled,
   endSlot,
   label,
   tone,
}: {
   label: ReactNode;
   children?: ReactNode;
   color?: MenuTone;
   tone?: MenuTone;
   disabled?: boolean;
   endSlot?: ReactNode;
}) {
   const [open, setOpen] = useState(false);
   const layerId = useId();
   const context = useContext(MenuContext);

   useEffect(() => {
      if (!context.isMobile || !open || !context.layerController) return;
      context.layerController.register(layerId, () => setOpen(false));
      return () => context.layerController?.unregister(layerId);
   }, [context.isMobile, context.layerController, layerId, open]);

   function closeAll() {
      setOpen(false);
      context.close();
   }

   const submenuContent = <MenuContext.Provider value={{ ...context, close: closeAll }}>{children}</MenuContext.Provider>;

   if (context.isMobile) {
      return (
         <Drawer.Root open={open} onOpenChange={setOpen}>
            <SubmenuTrigger color={color} tone={tone} disabled={disabled} endSlot={endSlot}>
               {label}
            </SubmenuTrigger>
            <Drawer.Portal>
               <HuginnDrawerBackdrop bottomInset={context.bottomInset} />
               <HuginnDrawerPopup bottomInset={context.bottomInset}>{submenuContent}</HuginnDrawerPopup>
            </Drawer.Portal>
         </Drawer.Root>
      );
   }

   return (
      <Menu.SubmenuRoot>
         <SubmenuTrigger color={color} tone={tone} disabled={disabled} endSlot={endSlot} label={typeof label === "string" ? label : undefined}>
            {label}
         </SubmenuTrigger>
         <Content side="right" align="start" sideOffset={12} alignOffset={-8}>
            {submenuContent}
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

export default HuginnMenu;
