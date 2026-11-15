import { Drawer, Popover } from "@base-ui/react";
import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer";
import { useIsMobile } from "@hooks/useIsMobile";
import { useStackBackHandler } from "@hooks/useStackBackHandler";
import { snowflake, WorkerID } from "@huginnjs/shared";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import clsx from "clsx";
import { createContext, type CSSProperties, type ReactNode, type RefObject, useContext, useMemo, useRef, useState } from "react";

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

const PopoverContext = createContext<{ isMobile: boolean; popupRef: RefObject<HTMLDivElement | null> } | null>(undefined!);

export default function HuginnPopover<T>(props: HuginnPopoverProps<T>) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));
   const isMobile = useIsMobile();
   const popupRef = useRef<HTMLDivElement>(null);

   const anchor = useMemo(
      () => ({
         getBoundingClientRect: () =>
            DOMRect.fromRect({
               x: (props.popover?.position?.[0] ?? 0) - (props.alignGap ?? 0),
               y: (props.popover?.position?.[1] ?? 0) - (props.sideGap ?? 0),
               width: 0,
               height: 0,
            }),
      }),
      [props.popover?.position, props.sideGap, props.alignGap],
   );

   const isOpen = props.popover?.isOpen ?? false;

   function handleOpenChange(newOpen: boolean) {
      // Opening is fully controlled by the `popover` prop now — this only ever fires on dismissal
      // (outside click, escape, etc).
      if (newOpen) return;
      props.onClose?.();
   }

   useStackBackHandler(`popover-${id}`, () => props.onClose?.(), isOpen);

   const children = (
      <PopoverContext.Provider value={{ isMobile, popupRef }}>
         <ContextMenuProvider active={isOpen} focusFallback={popupRef}>
            {props.renderChildren}
         </ContextMenuProvider>
      </PopoverContext.Provider>
   );

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
            <Popover.Backdrop className="fixed inset-0 z-10" />
            <Popover.Positioner
               className="z-10"
               anchor={anchor}
               align={props.align ?? "end"}
               side={props.side ?? "bottom"}
               collisionPadding={{ top: 28, bottom: 4, left: 4, right: 4 }}
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
         <DrawerPopup ref={context.popupRef} behindModal className={props.className}>
            {props.children}
            <ContextMenusRenderer />
         </DrawerPopup>
      );
   }

   return (
      <Popover.Popup
         ref={context?.popupRef}
         className={clsx(
            props.className,
            "border-surface bg-surface-void z-40 rounded-lg border shadow-xl transition-[opacity_transform] duration-200 outline-none data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-xl data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-xl",
         )}
         style={props.style}
      >
         {props.children}
         {/* Keep menu roots in the popup's React tree so Base UI can coordinate dismissal. */}
         <ContextMenusRenderer />
      </Popover.Popup>
   );
}

HuginnPopover.Panel = Panel;
