import type { CSSProperties, ReactNode } from "react";

import { Drawer } from "@base-ui/react";
import clsx from "clsx";

export const drawerPopupClass = clsx(
   "bg-surface-void pointer-events-auto flex w-full max-w-screen flex-col overflow-hidden rounded-t-xl p-2 shadow-lg outline-hidden select-none",
   "duration-200 [transition:transform_200ms,height_200ms,opacity_200ms]",
   "data-nested-drawer-swiping:duration-0",
   "[height:var(--drawer-height,auto)]",
   "[--bleed:3rem] [--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]",
   "[--peek:1rem] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
   "[--shrink:calc(1-var(--scale))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-step:0.1]",
   "[--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))] [--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
   "[--top-margin:10rem] data-nested-drawer-open:h-[calc(var(--height)+var(--bleed))]",
   "[transform:translateY(calc((var(--drawer-swipe-movement-y))+var(--drawer-snap-point-offset)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",
   "data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)]",
);

type DrawerInset = CSSProperties["bottom"];

export type HuginnOverlayLayerController = {
   register: (id: string, onClose: () => void) => void;
   unregister: (id: string) => void;
};

function getInsetValue(bottomInset?: DrawerInset) {
   if (typeof bottomInset === "number") return `${bottomInset}px`;
   return bottomInset ?? "var(--huginn-bottom-inset, 0px)";
}

export function HuginnDrawerBackdrop({ bottomInset, className, forceRender }: { bottomInset?: DrawerInset; className?: string; forceRender?: boolean }) {
   return (
      <Drawer.Backdrop
         forceRender={forceRender}
         className={clsx(
            "fixed inset-0 z-20 bg-black opacity-[calc(0.5*(1-var(--drawer-swipe-progress)))] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0",
            className,
         )}
         style={{ bottom: getInsetValue(bottomInset) }}
      />
   );
}

export function HuginnDrawerPopup({
   bottomInset,
   children,
   className,
   style,
}: {
   bottomInset?: DrawerInset;
   children?: ReactNode;
   className?: string;
   style?: CSSProperties;
}) {
   const inset = getInsetValue(bottomInset);

   return (
      <Drawer.Viewport className="fixed inset-0 z-30 flex items-end justify-center" style={{ bottom: inset }}>
         <Drawer.Popup className={clsx(drawerPopupClass, className)} style={{ maxHeight: `calc(100dvh - ${inset} - var(--top-margin))`, ...style }}>
            <div className="bg-surface mx-auto mb-2 h-1.5 w-16 shrink-0 rounded-full" />
            {children}
         </Drawer.Popup>
      </Drawer.Viewport>
   );
}

export const HuginnDrawer = Drawer;
