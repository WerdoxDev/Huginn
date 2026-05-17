import { Menu } from "@base-ui/react";
import clsx from "clsx";
import { isValidElement, type ReactNode } from "react";

type Tone = "default" | "negative";

export function HuginnMenu(props: Menu.Root.Props) {
   return <Menu.Root modal={true} {...props} />;
}

function Trigger(props: Menu.Trigger.Props & { asChild?: boolean }) {
   const { className, children, asChild, ...rest } = props;

   if (asChild && isValidElement(children)) {
      return <Menu.Trigger {...rest} nativeButton={false} className={clsx("cursor-pointer", className)} render={children} />;
   }

   return (
      <Menu.Trigger {...rest} className={clsx("cursor-pointer", className)} render={props.render}>
         {children}
      </Menu.Trigger>
   );
}

function Content(
   props: Menu.Popup.Props & {
      side?: Menu.Positioner.Props["side"];
      align?: Menu.Positioner.Props["align"];
      sideOffset?: number;
      alignOffset?: number;
   },
) {
   return (
      <Menu.Portal keepMounted={false}>
         <Menu.Positioner side={props.side} align={props.align} sideOffset={props.sideOffset} alignOffset={props.alignOffset}>
            <Menu.Popup
               className={clsx(
                  "flex flex-col rounded-lg bg-zinc-900 p-2 shadow-lg outline-hidden transition-[opacity_transform] duration-200 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:blur-sm data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:blur-sm",
                  props.className,
               )}
            >
               {props.children}
            </Menu.Popup>
         </Menu.Positioner>
      </Menu.Portal>
   );
}

function Item(props: {
   onClick?: () => void;
   label?: string;
   color?: Tone;
   endSlot?: ReactNode;
   className?: string;
   children?: ReactNode;
   disabled?: boolean;
}) {
   return (
      <Menu.Item
         onClick={props.onClick}
         label={props.label}
         disabled={props.disabled}
         className={clsx(
            "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:text-white/50",
            props.color === "negative" && "text-negative-100 data-highlighted:bg-negative-100/10",
            (!props.color || props.color === "default") && "data-highlighted:bg-surface-alt text-white/90 data-highlighted:text-white/90",
            props.className,
         )}
      >
         <div className="flex w-full items-center justify-between gap-x-3">
            <div className="truncate">{props.children}</div>
            <div className="flex items-center gap-x-1">{props.endSlot}</div>
         </div>
      </Menu.Item>
   );
}

function Separator(props: { className?: string }) {
   return <Menu.Separator className={clsx("bg-surface mx-2 my-2 h-px", props.className)} />;
}

function SubmenuRoot(props: Menu.SubmenuRoot.Props) {
   return <Menu.SubmenuRoot {...props} />;
}

function SubmenuTrigger(props: {
   onClick?: () => void;
   label?: string;
   color?: Tone;
   endSlot?: ReactNode;
   disabled?: boolean;
   className?: string;
   children?: ReactNode;
}) {
   return (
      <Menu.SubmenuTrigger
         onClick={props.onClick}
         label={props.label}
         openOnHover={true}
         delay={0}
         closeDelay={100}
         disabled={props.disabled}
         className={clsx(
            "flex min-w-28 cursor-pointer items-center justify-between gap-x-5 rounded-sm px-2 py-2 text-start text-sm text-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:text-white/50",
            props.color === "negative" && "text-negative-100 data-highlighted:bg-negative-100/10",
            (!props.color || props.color === "default") && "data-highlighted:bg-surface-alt text-white/90 data-highlighted:text-white/90",
            props.className,
         )}
      >
         <span className="flex w-full items-center justify-between gap-x-3">
            <span className="truncate">{props.children}</span>
            <span className="flex items-center gap-x-1 text-white/70">
               {props.endSlot}
               <IconMingcuteRightLine className="size-5 text-white/80" />
            </span>
         </span>
      </Menu.SubmenuTrigger>
   );
}

function Submenu(props: { label: ReactNode; children?: ReactNode; color?: Tone; disabled?: boolean; endSlot?: ReactNode }) {
   return (
      <Menu.SubmenuRoot>
         <SubmenuTrigger
            color={props.color}
            disabled={props.disabled}
            endSlot={props.endSlot}
            label={typeof props.label === "string" ? props.label : undefined}
         >
            {props.label}
         </SubmenuTrigger>
         <Content side="right" align="start" sideOffset={12} alignOffset={-8}>
            {props.children}
         </Content>
      </Menu.SubmenuRoot>
   );
}

HuginnMenu.Trigger = Trigger;
HuginnMenu.Content = Content;
HuginnMenu.Item = Item;
HuginnMenu.Separator = Separator;
HuginnMenu.SubmenuRoot = SubmenuRoot;
HuginnMenu.SubmenuTrigger = SubmenuTrigger;
HuginnMenu.Submenu = Submenu;
