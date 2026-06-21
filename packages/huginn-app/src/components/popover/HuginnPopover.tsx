import { Drawer, Popover } from "@base-ui/react";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer";
import { useIsMobile } from "@hooks/useIsMobile";
import { useStackBackHandler } from "@hooks/useStackBackHandler";
import { snowflake, WorkerID } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { createContext, isValidElement, useContext, useState, type HTMLProps, type ReactNode } from "react";

const PopoverContext = createContext<{ onClose?: () => void; isMobile: boolean } | null>(undefined!);

export default function HuginnPopover(props: {
   children?: ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   modal?: Popover.Root.Props["modal"];
}) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));
   const [open, setOpen] = useState(false);
   const modals = useModals();
   const isMobile = useIsMobile();

   function isAnyModalOpen() {
      return Object.values(modals).some((modal) => "isOpen" in modal && modal.isOpen);
   }

   function handleOpenChange(newOpen: boolean) {
      if (!newOpen && isAnyModalOpen()) return;

      if (props.open !== undefined) {
         props.onOpenChange?.(newOpen);
         return;
      }

      setOpen(newOpen);
   }

   const resolvedOpen = props.open !== undefined ? props.open : open;

   useStackBackHandler(`popover-${id}`, () => handleOpenChange(false), resolvedOpen);

   const children = (
      <PopoverContext.Provider value={{ onClose: () => handleOpenChange(false), isMobile: isMobile }}>{props.children}</PopoverContext.Provider>
   );

   if (isMobile) {
      return (
         <Drawer.Root open={resolvedOpen} onOpenChange={handleOpenChange}>
            {children}
         </Drawer.Root>
      );
   }

   return (
      <Popover.Root open={resolvedOpen} onOpenChange={handleOpenChange} modal={props.modal}>
         {children}
      </Popover.Root>
   );
}

function Trigger(props: HTMLProps<HTMLButtonElement> & { type?: Popover.Trigger.Props["type"]; asChild?: boolean }) {
   const { asChild, children, className, ...rest } = props;
   const context = useContext(PopoverContext)!;

   if (context.isMobile) {
      if (asChild && isValidElement(children)) {
         return <Drawer.Trigger {...rest} className={clsx("cursor-pointer", className)} render={children} />;
      }
      return (
         <Drawer.Trigger {...rest} className={clsx("cursor-pointer", className)}>
            {children}
         </Drawer.Trigger>
      );
   }

   if (asChild && isValidElement(children)) {
      return <Popover.Trigger {...rest} type={props.type} className={clsx("cursor-pointer", className)} render={children} />;
   }
   return (
      <Popover.Trigger {...rest} className={clsx("cursor-pointer", className)}>
         {children}
      </Popover.Trigger>
   );
}

function Panel(props: {
   children?: ReactNode;
   style?: React.CSSProperties;
   className?: string;
   side?: "top" | "right" | "bottom" | "left";
   align?: "start" | "center" | "end";
   sideGap?: number;
   alignGap?: number;
   keepMounted?: boolean;
}) {
   const context = useContext(PopoverContext)!;

   if (context.isMobile) {
      return (
         <Drawer.Portal keepMounted={props.keepMounted}>
            <DrawerBackdrop />
            <DrawerPopup behindModal className={props.className}>
               {props.children}
            </DrawerPopup>
         </Drawer.Portal>
      );
   }

   return (
      <Popover.Portal keepMounted={props.keepMounted}>
         <Popover.Positioner
            align={props.align ?? "end"}
            side={props.side ?? "bottom"}
            sideOffset={props.sideGap}
            alignOffset={props.alignGap}
            collisionPadding={0}
         >
            <Popover.Popup
               className={clsx(
                  props.className,
                  "border-surface z-40 rounded-lg border bg-zinc-900 shadow-xl transition-[opacity_transform] duration-200 outline-none data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-xl data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-xl",
               )}
               style={props.style}
            >
               {props.children}
            </Popover.Popup>
         </Popover.Positioner>
      </Popover.Portal>
   );
}

HuginnPopover.Trigger = Trigger;
HuginnPopover.Panel = Panel;
