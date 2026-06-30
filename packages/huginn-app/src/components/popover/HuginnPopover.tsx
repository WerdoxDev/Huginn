import { Drawer, Popover } from "@base-ui/react";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer";
import { useIsMobile } from "@hooks/useIsMobile";
import { useStackBackHandler } from "@hooks/useStackBackHandler";
import { snowflake, WorkerID } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { createContext, type CSSProperties, type ReactNode, useContext, useMemo, useState } from "react";

import type { PopoverStateProps } from "@/types";

export type HuginnPopoverProps<T> = {
   renderChildren?: ReactNode;
   popover?: PopoverStateProps<T>;
   onClose?: () => void;
   modal?: Popover.Root.Props["modal"];
   className?: string;
   style?: CSSProperties;
   side?: "top" | "right" | "bottom" | "left";
   align?: "start" | "center" | "end";
   sideGap?: number;
   alignGap?: number;
   keepMounted?: boolean;
};

const PopoverContext = createContext<{ isMobile: boolean } | null>(undefined!);

export default function HuginnPopover<T>(props: HuginnPopoverProps<T>) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));
   const isMobile = useIsMobile();
   const modals = useModals();

   const anchor = useMemo(
      () => ({
         getBoundingClientRect: () =>
            DOMRect.fromRect({
               x: props.popover?.anchor?.getBoundingClientRect().x ?? 0,
               y: props.popover?.anchor?.getBoundingClientRect().y ?? 0,
               width: 0,
               height: 0,
            }),
      }),
      [props.popover?.anchor],
   );

   const isOpen = props.popover?.isOpen ?? false;

   function isAnyModalOpen() {
      return Object.values(modals).some((modal) => "isOpen" in modal && modal.isOpen);
   }

   function handleOpenChange(newOpen: boolean) {
      console.log(newOpen);
      // Opening is fully controlled by the `popover` prop now — this only ever fires on dismissal
      // (outside click, escape, etc).
      if (newOpen) return;
      if (isAnyModalOpen()) return;
      props.onClose?.();
   }

   useStackBackHandler(`popover-${id}`, () => props.onClose?.(), isOpen);

   const children = <PopoverContext.Provider value={{ isMobile }}>{props.renderChildren}</PopoverContext.Provider>;

   if (isMobile) {
      return (
         <Drawer.Root open={isOpen} onOpenChange={handleOpenChange} modal={props.modal}>
            <Drawer.Portal keepMounted={props.keepMounted}>
               <DrawerBackdrop />
               {children}
            </Drawer.Portal>
         </Drawer.Root>
      );
   }

   return (
      <Popover.Root open={isOpen} onOpenChange={handleOpenChange} modal={props.modal}>
         <Popover.Portal keepMounted={props.keepMounted}>
            <Popover.Backdrop className="fixed inset-0" />
            <Popover.Positioner
               anchor={anchor}
               align={props.align ?? "end"}
               side={props.side ?? "bottom"}
               sideOffset={props.sideGap}
               alignOffset={props.alignGap}
               collisionPadding={0}
            >
               {children}
            </Popover.Positioner>
         </Popover.Portal>
      </Popover.Root>
   );
}

function Panel(props: { children?: ReactNode; className?: string; style?: CSSProperties }) {
   const context = useContext(PopoverContext);

   if (context?.isMobile) {
      return (
         <DrawerPopup behindModal className={props.className}>
            {props.children}
         </DrawerPopup>
      );
   }

   return (
      <Popover.Popup
         className={clsx(
            props.className,
            "border-surface z-40 rounded-lg border bg-zinc-900 shadow-xl transition-[opacity_transform] duration-200 outline-none data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-xl data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-xl",
         )}
         style={props.style}
      >
         {props.children}
      </Popover.Popup>
   );
}

HuginnPopover.Panel = Panel;
