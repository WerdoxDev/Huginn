import { Select } from "@base-ui/react";
import { Drawer } from "@base-ui/react";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer";
import HuginnLabel from "@components/HuginnLabel";
import { useIsMobile } from "@hooks/useIsMobile";
import { useStackBackHandler } from "@hooks/useStackBackHandler";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useState } from "react";

import type { SelectItem } from "@/types";

const SelectContext = createContext<{
   id: string;
   isMobile: boolean;
   isDrawerOpen: boolean;
   setIsDrawerOpen: (open: boolean) => void;
}>(undefined!);

export default function HuginnSelect<T = string>(props: {
   children?: ReactNode;
   className?: string;
   selected?: SelectItem<T>;
   onChange?: (value: SelectItem<T>) => void;
}) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));
   const isMobile = useIsMobile();
   const [isDrawerOpen, setIsDrawerOpen] = useState(false);

   function handleValueChange(value: SelectItem<T> | null) {
      if (!value) return;
      props.onChange?.(value);
      if (isMobile) setIsDrawerOpen(false);
   }

   useStackBackHandler(`select-drawer-${id}`, () => setIsDrawerOpen(false), isDrawerOpen);

   return (
      <SelectContext.Provider value={{ id, isMobile, isDrawerOpen, setIsDrawerOpen }}>
         <Select.Root
            id={id}
            modal={false}
            value={props.selected ?? null}
            onValueChange={handleValueChange}
            itemToStringLabel={(x) => x.text}
            // On mobile, prevent the native select popup from opening
            onOpenChange={isMobile ? () => {} : undefined}
         >
            <div className={clsx("flex flex-col", props.className)}>{props.children}</div>
         </Select.Root>
      </SelectContext.Provider>
   );
}

function List(props: {
   className?: string;
   children?: ReactNode;
   onClick?: () => void;
   placeholder?: string;
   hideArrow?: boolean;
   triggerClassName?: string;
}) {
   const context = useContext(SelectContext);

   return (
      <div className={clsx("bg-surface-alt w-full overflow-hidden rounded-lg lg:w-52", props.className)}>
         <Select.Trigger
            onClick={context.isMobile ? () => context.setIsDrawerOpen(true) : props.onClick}
            className={clsx(
               "relative flex w-full cursor-pointer items-center gap-x-1.5 p-2 text-white outline-hidden select-none",
               props.triggerClassName,
            )}
         >
            <Select.Value className="flex shrink items-center gap-x-2 overflow-hidden" placeholder={props.placeholder} render={<div></div>}>
               {(value?: SelectItem) =>
                  value ? (
                     <>
                        {value.icon}
                        {value.text && <span className="truncate">{value.text}</span>}
                     </>
                  ) : (
                     <span className="text-text/80">{props.placeholder}</span>
                  )
               }
            </Select.Value>
            {!props.hideArrow && (
               <Select.Icon
                  className={(state) =>
                     clsx("ml-auto flex h-6 w-6 shrink-0 items-center justify-center transition-transform", state.open && "rotate-180")
                  }
               >
                  <IconMingcuteDownFill className="text-primary-500 h-6 w-6" />
               </Select.Icon>
            )}
         </Select.Trigger>
         {props.children}
      </div>
   );
}

function ItemsWrapper(props: {
   className?: string;
   children?: ReactNode;
   side?: Select.Positioner.Props["side"];
   align?: Select.Positioner.Props["align"];
   sideOffset?: Select.Positioner.Props["sideOffset"];
   alignOffset?: Select.Positioner.Props["alignOffset"];
}) {
   const context = useContext(SelectContext);
   const sideOffset = props.sideOffset ?? 4;
   const alignOffset = props.alignOffset ?? 0;

   if (context.isMobile) {
      return (
         <Drawer.Root open={context.isDrawerOpen} onOpenChange={context.setIsDrawerOpen}>
            <Drawer.Portal>
               <DrawerBackdrop forceRender />
               <DrawerPopup>
                  <div className={clsx("flex flex-col overflow-y-auto", props.className)}>{props.children}</div>
               </DrawerPopup>
            </Drawer.Portal>
         </Drawer.Root>
      );
   }

   return (
      <Select.Portal>
         <Select.Positioner
            side={props.side}
            align={props.align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            alignItemWithTrigger={false}
            className="z-20"
            style={{ width: "var(--anchor-width)" }}
         >
            <Select.Popup
               className={clsx(
                  "scroll-surface scroll-super-thin bg-surface-alt outline-primary-800 overflow-y-auto rounded-lg outline transition-[opacity_transform_blur] duration-200 data-ending-style:translate-y-5 data-ending-style:opacity-0 data-ending-style:blur-sm data-starting-style:translate-y-5 data-starting-style:opacity-0 data-starting-style:blur-sm",
                  props.className,
               )}
               style={{ maxHeight: "min(calc(var(--available-height) - 0px), 100vh)" }}
            >
               <Select.List className="flex flex-col">{props.children}</Select.List>
            </Select.Popup>
         </Select.Positioner>
      </Select.Portal>
   );
}

function Item<T = string>(props: { item: SelectItem<T>; children?: ReactNode; hideSelected?: boolean; className?: string }) {
   const context = useContext(SelectContext);

   const itemClass = clsx(
      "group data-highlighted:bg-surface active:bg-surface flex cursor-pointer items-center gap-x-2 px-2 py-2 text-white/70",
      context.isMobile ? "rounded-md px-3 py-3" : "data-selected:bg-surface/50 data-selected:text-white",
      props.className,
   );

   if (context.isMobile) {
      return (
         // Select.Item still needs to be used so Select.Root tracks the selected value
         <Select.Item
            value={props.item}
            className={itemClass}
            // close drawer on selection — onValueChange in root also handles this,
            // but onClick gives instant feedback
            onClick={() => context.setIsDrawerOpen(false)}
         >
            {props.item.icon}
            {props.item.text && <Select.ItemText className="wrap-anywhere">{props.item.text}</Select.ItemText>}
            {props.children}
            {!props.hideSelected && (
               <Select.ItemIndicator
                  keepMounted
                  className={(state) =>
                     clsx(
                        "text-primary-500 ml-auto flex size-5 shrink-0 items-center justify-center transition-opacity",
                        !state.selected && "opacity-0",
                     )
                  }
               >
                  <IconMingcuteCheckFill className="size-5" />
               </Select.ItemIndicator>
            )}
         </Select.Item>
      );
   }

   return (
      <Select.Item value={props.item} className={itemClass}>
         {props.item.icon}
         {props.item.text && <Select.ItemText className="wrap-anywhere">{props.item.text}</Select.ItemText>}
         {props.children}
         {!props.hideSelected && (
            <Select.ItemIndicator
               keepMounted
               className={(state) =>
                  clsx("text-primary-500 ml-auto flex size-5 shrink-0 items-center justify-center transition-opacity", !state.selected && "opacity-0")
               }
            >
               <IconMingcuteCheckFill className="size-5" />
            </Select.ItemIndicator>
         )}
      </Select.Item>
   );
}

function Label(props: { children?: ReactNode }) {
   const context = useContext(SelectContext);
   return <HuginnLabel htmlFor={context.id}>{props.children}</HuginnLabel>;
}

HuginnSelect.Label = Label;
HuginnSelect.List = List;
HuginnSelect.ItemsWrapper = ItemsWrapper;
HuginnSelect.Item = Item;
