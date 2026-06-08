import { Popover } from "@base-ui/react";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { isValidElement, useState, type HTMLProps, type ReactNode } from "react";

export default function HuginnPopover(props: {
   children?: ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   modal?: Popover.Root.Props["modal"];
}) {
   const [open, setOpen] = useState(false);
   const modals = useModals();

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

   return (
      <Popover.Root open={props.open !== undefined ? props.open : open} onOpenChange={handleOpenChange} modal={props.modal}>
         {props.children}
      </Popover.Root>
   );
}

function Trigger(props: HTMLProps<HTMLButtonElement> & { type?: Popover.Trigger.Props["type"]; asChild?: boolean }) {
   const { asChild, children, className, ...rest } = props;

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
   className?: string;
   side?: "top" | "right" | "bottom" | "left";
   align?: "start" | "center" | "end";
   sideGap?: number;
   alignGap?: number;
   keepMounted?: boolean;
}) {
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
                  "border-surface bg-surface-deep z-40 rounded-lg border shadow-xl transition-[opacity_transform] duration-200 outline-none data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-xl data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-xl",
               )}
            >
               {props.children}
            </Popover.Popup>
         </Popover.Positioner>
      </Popover.Portal>
   );
}

HuginnPopover.Trigger = Trigger;
HuginnPopover.Panel = Panel;
