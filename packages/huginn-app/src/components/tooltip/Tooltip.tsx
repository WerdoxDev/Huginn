import { Tooltip as BaseTooltip } from "@base-ui/react";
import { useIsMobile } from "@hooks/useIsMobile";
import clsx from "clsx";
import { type CSSProperties, type HTMLProps, isValidElement, type ReactNode } from "react";

export default function Tooltip(props: { hideOnMobile?: boolean; children?: ReactNode; open?: boolean }) {
   const isMobile = useIsMobile();
   const disabled = props.hideOnMobile && isMobile;

   return (
      <BaseTooltip.Root disableHoverablePopup disabled={disabled} open={props.open}>
         {props.children}
      </BaseTooltip.Root>
   );
}

function Trigger(props: BaseTooltip.Trigger.Props & { asChild?: boolean }) {
   const { asChild, children, className, ...rest } = props;

   if (asChild && isValidElement(children)) {
      return <BaseTooltip.Trigger {...rest} closeOnClick={false} className={clsx("cursor-pointer", className)} render={children} delay={0} />;
   }

   return (
      <BaseTooltip.Trigger closeOnClick={false} {...rest} className={clsx("cursor-pointer", className)} delay={0}>
         {children}
      </BaseTooltip.Trigger>
   );
}

function Content(
   props: {
      extraStyle?: CSSProperties;
      side?: BaseTooltip.Positioner.Props["side"];
      align?: BaseTooltip.Positioner.Props["align"];
   } & HTMLProps<HTMLDivElement>,
) {
   const { extraStyle, ...rest } = props;
   return (
      <BaseTooltip.Portal keepMounted={false}>
         <BaseTooltip.Positioner side={props.side} align={props.align} sideOffset={8} className="z-50">
            <BaseTooltip.Popup
               {...rest}
               className={clsx(
                  "border-surface rounded-md border bg-zinc-900 px-2.5 py-1 text-base whitespace-nowrap text-white/80 shadow-lg transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0",
                  props.className,
               )}
               style={extraStyle}
            >
               {props.children}
               <BaseTooltip.Arrow className="border-surface flex h-2.5 w-2.5 rounded-br-full border-t border-l bg-zinc-900 data-[side=bottom]:-top-1 data-[side=bottom]:rotate-45 data-[side=left]:-right-3.25 data-[side=left]:rotate-90 data-[side=right]:-left-3.25 data-[side=right]:-rotate-90 data-[side=top]:-bottom-1 data-[side=top]:-rotate-135" />
            </BaseTooltip.Popup>
         </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
   );
}

Tooltip.Trigger = Trigger;
Tooltip.Content = Content;
