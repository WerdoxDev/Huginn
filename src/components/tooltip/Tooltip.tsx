import { TooltipOptions } from "@/types";
import { TooltipContext, useTooltip, useTooltipContext } from "@contexts/tooltipContext";
import { FloatingArrow, useMergeRefs } from "@floating-ui/react";
import { Portal, Transition } from "@headlessui/react";
import * as React from "react";

export function Tooltip({ children, ...options }: { children: React.ReactNode } & TooltipOptions) {
   // This can accept any props as options, e.g. `placement`,
   // or other positioning options.
   const tooltip = useTooltip(options);
   return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

const Trigger = React.forwardRef<HTMLElement, React.HTMLProps<HTMLElement> & { asChild?: boolean }>(function TooltipTrigger(
   { children, asChild = false, ...props },
   propRef,
) {
   const context = useTooltipContext();
   const childrenRef = (children as any).ref;
   const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

   // `asChild` allows the user to pass any element as the anchor
   if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
         children,
         context.getReferenceProps({
            ref,
            ...props,
            ...children.props,
            "data-state": context.open ? "open" : "closed",
         }),
      );
   }

   return (
      <button
         ref={ref}
         // The user can style the trigger based on the state
         data-state={context.open ? "open" : "closed"}
         {...context.getReferenceProps(props)}
      >
         {children}
      </button>
   );
});

const Content = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(function TooltipContent(
   { style, ...props },
   propRef,
) {
   const context = useTooltipContext();
   const ref = useMergeRefs([context.refs.setFloating, propRef]);

   // if (!context.open) return null;

   return (
      <Transition
         show={context.open}
         enter="transition-opacity duration-100"
         enterFrom="opacity-0"
         enterTo="opacity-100"
         leave="transition-opacity duration-100"
         leaveFrom="opacity-100"
         leaveTo="opacity-0"
      >
         <Portal>
            <div
               className="z-10 rounded-md bg-zinc-900 px-2.5 py-1.5 text-base text-text/80 shadow-lg"
               ref={ref}
               style={{
                  ...context.floatingStyles,
                  ...style,
               }}
               {...context.getFloatingProps(props)}
            >
               {context.getFloatingProps(props).children as React.ReactNode}
               <div
                  style={{ left: context.middlewareData.arrow?.x, top: context.middlewareData.arrow?.y }}
                  ref={context.arrowRef}
                  className="absolute -z-10 h-2.5 w-2.5 rotate-45 bg-zinc-900"
               />
            </div>
         </Portal>
      </Transition>
   );
});

Tooltip.Trigger = Trigger;
Tooltip.Content = Content;
