import { TooltipContext, useTooltip, useTooltipContext } from "@contexts/TooltipContext";
import { useMergeRefs } from "@floating-ui/react";
import { Portal, Transition } from "@headlessui/react";
import { useIsMobile } from "@hooks/useIsMobile";
import { omit } from "@huginn/shared";
import clsx from "clsx";
import { cloneElement, type HTMLProps, isValidElement, type ReactNode, useMemo } from "react";

import type { TooltipOptions } from "@/types";

export default function Tooltip({ children, ...options }: { children: ReactNode } & TooltipOptions) {
   // This can accept any props as options, e.g. `placement`,
   // or other positioning options.
   const tooltip = useTooltip(options);
   return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

function Trigger(props: HTMLProps<HTMLButtonElement> & { asChild?: boolean }) {
   const context = useTooltipContext();
   // biome-ignore lint/suspicious/noExplicitAny: no explanation
   const childrenRef = (props.children as any)?.ref;
   // biome-ignore lint/suspicious/noExplicitAny: no explanation
   const childrenProps = (props.children as any)?.props;
   const ref = useMergeRefs([context.refs.setReference, props.ref, childrenRef]);

   // `asChild` allows the user to pass any element as the anchor
   if (props.asChild && isValidElement(props.children)) {
      return cloneElement(
         props.children,
         context.getReferenceProps({
            ref,
            ...omit(props, ["asChild", "children"]),
            ...childrenProps,
            "data-state": context.open ? "open" : "closed",
         }),
      );
   }

   return (
      <button
         ref={ref}
         // The user can style the trigger based on the state
         data-state={context.open ? "open" : "closed"}
         {...omit(context.getReferenceProps(props), ["asChild"])}
         className={clsx("cursor-pointer", context.getReferenceProps(props)?.className as string)}
      >
         {props.children}
      </button>
   );
}

function Content(props: { arrowClassName?: string; extraStyle?: React.CSSProperties } & HTMLProps<HTMLDivElement>) {
   const context = useTooltipContext();
   const ref = useMergeRefs([context.refs.setFloating, props.ref]);
   context.placement;

   const staticSide = useMemo(
      () =>
         ({
            top: "bottom",
            right: "left",
            bottom: "top",
            left: "right",
         })[context.placement.split("-")[0]] ?? "",
      [context.placement],
   );

   const isMobile = useIsMobile();

   return (
      <Transition
         show={context.open && (!isMobile || !context.hideOnMobile)}
         enter="transition-opacity duration-100"
         enterFrom="opacity-0"
         enterTo="opacity-100"
         leave="transition-opacity duration-100"
         leaveFrom="opacity-100"
         leaveTo="opacity-0"
      >
         <Portal>
            <div
               className={clsx(
                  "border-surface absolute z-999 rounded-md border bg-zinc-900 px-2.5 py-1.5 text-base whitespace-nowrap text-white/80 shadow-lg",
                  props.className,
               )}
               ref={ref}
               style={{
                  ...context.floatingStyles,
                  ...props.style,
                  ...props.extraStyle,
               }}
               {...omit(context.getFloatingProps(props), ["className", "extraStyle"])}
            >
               {context.getFloatingProps(props).children as ReactNode}
               <div
                  style={{
                     left: context.middlewareData.arrow?.x,
                     top: context.middlewareData.arrow?.y,
                     [staticSide]: "-5px",
                  }}
                  ref={context.arrowRef}
                  className={clsx(
                     props.arrowClassName,
                     "border-surface absolute h-2.5 w-2.5 border-t border-l bg-zinc-900",
                     context.placement.includes("bottom") && "rotate-45",
                     context.placement.includes("top") && "rotate-[-135deg]",
                     context.placement.includes("left") && "-rotate-225",
                     context.placement.includes("right") && "-rotate-45",
                  )}
               />
            </div>
         </Portal>
      </Transition>
   );
}

Tooltip.Trigger = Trigger;
Tooltip.Content = Content;
