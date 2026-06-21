import { ContextMenu as BaseContextMenu, Drawer, Menu } from "@base-ui/react";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer"; // 👈 shared
import { HuginnErrorBoundary } from "@components/HuginnErrorBoundary";
import LoadingIcon from "@components/LoadingIcon";
import { useBackHandler } from "@hooks/useBackHandler";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useIsMobile } from "@hooks/useIsMobile";
import { useModals } from "@stores/modalsStore";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import clsx from "clsx";
import { createContext, type ReactNode, type RefObject, useContext, useMemo, useState } from "react";

import type { ContextMenuItemProps, ContextMenuProps } from "@/types";

type Tone = "default" | "negative";

const ContextMenuContext = createContext<{ onClose?: () => void; isMobile: boolean } | null>(undefined!);

const popupClass = clsx(
   "z-998 flex min-w-28 flex-col rounded-lg bg-zinc-900 p-2 shadow-lg outline-hidden",
   "transition-opacity duration-100",
   "data-starting-style:opacity-0",
   "data-ending-style:opacity-0",
);

export default function ContextMenu(props: ContextMenuProps) {
   const isMobile = useIsMobile();

   const anchor = useMemo(
      () => ({
         getBoundingClientRect: () =>
            DOMRect.fromRect({
               x: props.position?.[0] ?? 0,
               y: props.position?.[1] ?? 0,
               width: 0,
               height: 0,
            }),
      }),
      [props.position],
   );

   const { updateModals } = useModals();
   const [key, setKey] = useState(0);

   const queryErrorResetBoundary = useQueryErrorResetBoundary();
   const handleError = useErrorHandler({
      cancel: {
         callback() {
            queryErrorResetBoundary.reset();
            setKey((k) => k + 1);
            updateModals({ info: { isOpen: false } });
         },
      },
   });

   useBackHandler("context-menu", 50, () => {
      if (props.isOpen) {
         props.onClose?.();
         return true;
      }
   });

   function onError(e: unknown) {
      props.onClose?.();
      handleError(e);
   }

   const children = (
      <ContextMenuContext.Provider value={{ onClose: props.onClose, isMobile: isMobile }}>{props.renderChildren}</ContextMenuContext.Provider>
   );

   return (
      <HuginnErrorBoundary onError={onError} resetKey={key}>
         {isMobile ? (
            <Drawer.Root
               open={props.isOpen ?? false}
               onOpenChange={(open) => {
                  if (!open) props.onClose?.();
               }}
            >
               <Drawer.Portal container={props.parent ?? undefined}>
                  <DrawerBackdrop forceRender />
                  <DrawerPopup>{children}</DrawerPopup>
               </Drawer.Portal>
            </Drawer.Root>
         ) : (
            <BaseContextMenu.Root
               open={props.isOpen ?? false}
               onOpenChange={(open) => {
                  if (!open) props.onClose?.();
               }}
            >
               <BaseContextMenu.Portal container={props.parent ?? undefined}>
                  <BaseContextMenu.Positioner anchor={anchor} sideOffset={0} alignOffset={0}>
                     <BaseContextMenu.Popup className={popupClass}>{children}</BaseContextMenu.Popup>
                  </BaseContextMenu.Positioner>
               </BaseContextMenu.Portal>
            </BaseContextMenu.Root>
         )}
      </HuginnErrorBoundary>
   );
}

function Item(
   props: ContextMenuItemProps &
      React.ButtonHTMLAttributes<HTMLButtonElement> & {
         ref?: RefObject<HTMLButtonElement>;
         preventClose?: boolean;
         color?: Tone;
      },
) {
   const [isLoading, setIsLoading] = useState(false);
   const context = useContext(ContextMenuContext)!;

   function handleClick() {
      const result = props.onClick?.({} as React.MouseEvent<HTMLButtonElement>) as unknown;

      if (result instanceof Promise) {
         setIsLoading(true);
         result.finally(() => {
            setIsLoading(false);
            if (!props.preventClose) context.onClose?.();
         });
         return;
      }

      if (!props.preventClose) context.onClose?.();
   }

   const itemClass = clsx(
      "flex shrink-0 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-hidden",
      context.isMobile && "px-3 py-3",
      "data-disabled:cursor-not-allowed",
      !props.color || props.color === "default"
         ? "data-highlighted:bg-surface-alt active:bg-surface-alt text-white/90 data-disabled:text-white/50"
         : "text-negative-100 data-highlighted:bg-negative-100/10 active:bg-negative-100/10 data-disabled:text-negative-100/50",
      props.className,
   );

   if (context.isMobile) {
      return (
         <button ref={props.ref} type="button" disabled={props.disabled || isLoading} onClick={handleClick} className={itemClass}>
            {props.label}
            {isLoading ? <LoadingIcon /> : props.children}
         </button>
      );
   }

   return (
      <BaseContextMenu.Item
         ref={props.ref}
         label={props.label}
         disabled={props.disabled || isLoading}
         closeOnClick={false}
         onClick={handleClick}
         className={itemClass}
      >
         {props.label}
         {isLoading ? <LoadingIcon /> : props.children}
      </BaseContextMenu.Item>
   );
}

function SubmenuContent(
   props: Menu.Popup.Props & {
      side?: Menu.Positioner.Props["side"];
      align?: Menu.Positioner.Props["align"];
      sideOffset?: number;
      alignOffset?: number;
   },
) {
   return (
      <Menu.Portal keepMounted={false}>
         <Menu.Positioner side={props.side} align={props.align} sideOffset={props.sideOffset} alignOffset={props.alignOffset}>
            <Menu.Popup className={clsx(popupClass, props.className)}>{props.children}</Menu.Popup>
         </Menu.Positioner>
      </Menu.Portal>
   );
}

function Submenu(props: { label: ReactNode; children?: ReactNode; color?: Tone; disabled?: boolean; endSlot?: ReactNode }) {
   const context = useContext(ContextMenuContext)!;
   const [isOpen, setIsOpen] = useState(false);

   const triggerClass = clsx(
      "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none",
      context?.isMobile && "px-3 py-3",
      "data-disabled:cursor-not-allowed data-disabled:text-white/50",
      !props.color || props.color === "default"
         ? "data-highlighted:bg-surface-alt active:bg-surface-alt text-white/90 data-disabled:text-white/50"
         : "text-negative-100 data-highlighted:bg-negative-100/10 active:bg-negative-100/10 data-disabled:text-negative-100/50",
   );

   useBackHandler("context-menu-submenu", 60, () => {
      if (isOpen) {
         setIsOpen(false);
         return true;
      }
   });

   function handleClose() {
      setIsOpen(false);
      context?.onClose?.();
   }

   const children = (
      <ContextMenuContext.Provider value={{ onClose: handleClose, isMobile: context.isMobile }}>{props.children}</ContextMenuContext.Provider>
   );

   if (context?.isMobile) {
      return (
         <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
            <Drawer.Trigger disabled={props.disabled} className={triggerClass}>
               <span className="flex w-full items-center justify-between gap-x-3">
                  <span className="truncate">{props.label}</span>
                  <span className="flex items-center gap-x-1 text-white/70">
                     {props.endSlot}
                     <IconMingcuteRightLine className="size-5 text-white/80" />
                  </span>
               </span>
            </Drawer.Trigger>

            <Drawer.Portal>
               <DrawerBackdrop />
               <DrawerPopup>{children}</DrawerPopup>
            </Drawer.Portal>
         </Drawer.Root>
      );
   }

   return (
      <Menu.SubmenuRoot>
         <Menu.SubmenuTrigger
            openOnHover
            delay={0}
            closeDelay={100}
            disabled={props.disabled}
            label={typeof props.label === "string" ? props.label : undefined}
            className={triggerClass}
         >
            <span className="flex w-full items-center justify-between gap-x-3">
               <span className="truncate">{props.label}</span>
               <span className="flex items-center gap-x-1 text-white/70">
                  {props.endSlot}
                  <IconMingcuteRightLine className="size-5 text-white/80" />
               </span>
            </span>
         </Menu.SubmenuTrigger>

         <SubmenuContent side="right" align="start" sideOffset={12} alignOffset={-8}>
            {children}
         </SubmenuContent>
      </Menu.SubmenuRoot>
   );
}

function Divider(props: { className?: string }) {
   return <BaseContextMenu.Separator className={clsx("bg-surface mx-1 my-2 h-px shrink-0", props.className)} />;
}

ContextMenu.Item = Item;
ContextMenu.Submenu = Submenu;
ContextMenu.Divider = Divider;
