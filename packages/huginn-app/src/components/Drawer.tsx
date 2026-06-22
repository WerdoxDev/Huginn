import type { ReactNode } from "react";

import { Drawer } from "@base-ui/react";
import clsx from "clsx";

export const drawerPopupClass = clsx(
   "flex w-full flex-col overflow-visible rounded-t-xl bg-zinc-900 p-2 shadow-lg outline-hidden select-none",
   "transition-[transform_height_opacity] duration-200",
   "data-starting-style:[transform:translateY(calc(100%+2px))]",
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
   "[--top-margin:10rem]",
   "data-nested-drawer-open:h-[calc(var(--height)+var(--bleed))]",
   "data-nested-drawer-swiping:duration-0",
   "max-h-[calc(100dvh-var(--top-margin))] min-h-0",
   "[padding-bottom:max(0.5rem,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]",
   // "[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]",
   "[transform:translateY(calc((var(--drawer-swipe-movement-y))+var(--drawer-snap-point-offset)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",
);

export function DrawerBackdrop(props: { forceRender?: boolean; passThrough?: boolean }) {
   return (
      <Drawer.Backdrop
         forceRender={props.forceRender}
         className={clsx(
            "fixed inset-0 top-6 z-10 bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-200 [--backdrop-opacity:0.5] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0",
            props.passThrough && "pointer-events-none",
         )}
      />
   );
}

export function DrawerPopup(props: { children: ReactNode; className?: string; behindModal?: boolean; passThrough?: boolean }) {
   return (
      <Drawer.Viewport
         className={clsx(
            "fixed inset-0 flex items-end justify-center",
            props.passThrough && "pointer-events-none",
            props.behindModal ? "z-10" : "z-20",
         )}
         data-ignore-swipe
      >
         <Drawer.Popup className={clsx(drawerPopupClass, props.className, "pointer-events-auto")}>
            <div className="bg-surface mx-auto mb-2 h-1.5 w-16 shrink-0 rounded-full" />
            {props.children}
         </Drawer.Popup>
      </Drawer.Viewport>
   );
}
