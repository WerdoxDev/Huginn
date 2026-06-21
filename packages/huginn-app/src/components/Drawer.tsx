import type { ReactNode } from "react";

import { Drawer } from "@base-ui/react";
import clsx from "clsx";

export const drawerPopupClass = clsx(
   "z-998 flex w-full flex-col rounded-t-xl bg-zinc-900 p-2 shadow-lg outline-hidden select-none",
   "transition-[transform_height_opacity] duration-200",
   "data-starting-style:translate-y-full",
   "data-ending-style:translate-y-full",
   "[--bleed:3rem] [--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]",
   "[--peek:1rem]",
   "[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
   "[--shrink:calc(1-var(--scale))]",
   "[--stack-step:0.05]",
   "[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]",
   "[--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))]",
   "[--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
   "data-nested-drawer-open:h-[calc(var(--height)+var(--bleed))]",
   "[transform:translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",
   "data-nested-drawer-swiping:duration-0",
);

export function DrawerBackdrop() {
   return (
      <Drawer.Backdrop className="fixed inset-0 top-6 bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-200 [--backdrop-opacity:0.5] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />
   );
}

export function DrawerPopup({ children, className }: { children: ReactNode; className?: string }) {
   return (
      <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
         <Drawer.Popup className={clsx(drawerPopupClass, className)}>
            <div className="bg-surface mx-auto mb-2 h-1.5 w-16 shrink-0 rounded-full" />
            {children}
         </Drawer.Popup>
      </Drawer.Viewport>
   );
}
