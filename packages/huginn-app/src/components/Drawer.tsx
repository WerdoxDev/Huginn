import type { CSSProperties, ReactNode } from "react";

import { Drawer } from "@base-ui/react";
import { useInset } from "@contexts/InsetContext";
import clsx from "clsx";

export const drawerPopupClass = clsx(
   // "bg-surface-deep pointer-events-auto flex w-full max-w-screen flex-col overflow-visible rounded-t-xl p-2 shadow-lg outline-none select-none",
   // "[height:var(--drawer-height,auto)]",
   // // "[transform-origin:50%_calc(100%-var(--bleed))]",
   // // "[transform:translateY(calc((var(--drawer-swipe-movement-y))+var(--drawer-snap-point-offset)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",
   // "[transform:translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",
   // "[--bleed:3rem]",
   // "[--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))] [--peek:1rem]",
   // "[--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))] [--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
   // "[--shrink:calc(1-var(--scale))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
   // "[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-step:0.05]",
   // "[transition:transform_2000ms,height_2000ms,opacity_2000ms]",
   // // "after:pointer-events-none after:absolute after:inset-0 after:bg-transparent after:transition-[background-color] after:duration-2000 after:content-['']",
   // "data-ending-style:[transform:translateY(calc(100%-var(--bleed)+2px))]",
   // "data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*2000ms)]",
   // "data-nested-drawer-open:h-[calc(var(--height)+var(--bleed))] data-nested-drawer-open:overflow-hidden",
   // "data-nested-drawer-swiping:duration-0 data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*2000ms)]",
   // "data-starting-style:[transform:translateY(calc(100%-var(--bleed)+2px))] data-swiping:duration-0",
   // "data-swiping:select-none data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*2000ms)]",

   "pointer-events-auto flex w-full max-w-screen flex-col overflow-visible rounded-t-xl bg-zinc-900 p-2 shadow-lg outline-hidden select-none",
   "duration-200 [transition:transform_200ms,height_200ms,opacity_200ms]",

   // "data-starting-style:[transform:translateY(calc(100%-var(--bleed)+2px))] data-swiping:duration-0",
   // "data-ending-style:[transform:translateY(calc(100%-var(--bleed)+2px))]",
   "data-nested-drawer-swiping:duration-0",

   "[height:var(--drawer-height,auto)]",
   "[--bleed:3rem] [--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]",
   "[--peek:1rem]",
   "[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
   "[--shrink:calc(1-var(--scale))]",
   "[--stack-step:0.1]",
   "[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]",
   "[--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))]",
   "[--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
   "[--top-margin:10rem]",
   "data-nested-drawer-open:h-[calc(var(--height)+var(--bleed))]",
   "[transform:translateY(calc((var(--drawer-swipe-movement-y))+var(--drawer-snap-point-offset)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",

   // "[padding-bottom:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] shadow-black/12",
   // "[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]",
   // "transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
   // "after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-[var(--bleed)] after:bg-[inherit] after:content-['']",
   "data-ending-style:[transform:translateY(calc(100%+var(--bottom-offset)))] data-starting-style:[transform:translateY(calc(100%+var(--bottom-offset))))]",
   // "data-ending-style:[padding-bottom:0] data-starting-style:[padding-bottom:0]",
);

export function DrawerBackdrop(props: { forceRender?: boolean; passThrough?: boolean }) {
   const { lastNavBarHeight, shouldResizeWindow, lastKeyboardHeight, isKeyboardOpen } = useInset();

   return (
      <Drawer.Backdrop
         forceRender={props.forceRender}
         className={clsx(
            "fixed inset-0 top-6 z-10 bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-200 [--backdrop-opacity:0.5] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0",
            props.passThrough && "pointer-events-none",
         )}
         style={{ bottom: shouldResizeWindow && isKeyboardOpen ? lastKeyboardHeight + lastNavBarHeight : lastNavBarHeight }}
      />
   );
}

export function DrawerPopup(props: { children: ReactNode; className?: string; behindModal?: boolean; passThrough?: boolean }) {
   const { lastNavBarHeight, shouldResizeWindow, lastKeyboardHeight, isKeyboardOpen } = useInset();
   const bottomOffset = shouldResizeWindow && isKeyboardOpen ? lastKeyboardHeight + lastNavBarHeight : lastNavBarHeight;

   return (
      <Drawer.Viewport
         className={clsx(
            "fixed inset-0 flex items-end justify-center",
            props.passThrough && "pointer-events-none",
            props.behindModal ? "z-10" : "z-20",
         )}
         style={{ bottom: bottomOffset }}
         data-ignore-swipe
      >
         <Drawer.Popup
            className={clsx(drawerPopupClass, props.className)}
            style={
               {
                  "--bottom-offset": `${bottomOffset}px`,
                  maxHeight: `calc(100dvh - ${bottomOffset}px - var(--top-margin))`,
               } as CSSProperties
            }
         >
            <div className="bg-surface mx-auto mb-2 h-1.5 w-16 shrink-0 rounded-full" />
            {props.children}
         </Drawer.Popup>
      </Drawer.Viewport>
   );
}
