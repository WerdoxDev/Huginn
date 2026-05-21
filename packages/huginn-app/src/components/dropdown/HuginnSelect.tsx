import { Select } from "@base-ui/react";
import HuginnLabel from "@components/HuginnLabel";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useState } from "react";

import type { SelectItem } from "@/types";

type SelectContextValue = {
   id: string;
};

const SelectContext = createContext<SelectContextValue>({
   id: "",
});

export default function HuginnSelect(props: {
   children?: ReactNode;
   className?: string;
   selected?: SelectItem;
   onChange?: (value: SelectItem) => void;
}) {
   const [id] = useState(() => snowflake.generateString(WorkerID.APP));

   function handleValueChange(value: SelectItem | null) {
      if (!value) return;
      props.onChange?.(value);
   }

   return (
      <SelectContext.Provider value={{ id: id }}>
         <Select.Root id={id} modal={false} value={props.selected ?? null} onValueChange={handleValueChange} itemToStringLabel={(x) => x.text}>
            <div className={clsx("flex flex-col", props.className)}>{props.children}</div>
         </Select.Root>
      </SelectContext.Provider>
   );
}

function List(props: { className?: string; children?: ReactNode; onClick?: () => void; placeholder?: string }) {
   return (
      <div className={clsx("bg-surface-alt w-52 overflow-hidden rounded-lg", props.className)}>
         <Select.Trigger
            onClick={props.onClick}
            className="relative flex w-full cursor-pointer items-center gap-x-1.5 p-2 text-white outline-hidden select-none"
         >
            <Select.Value className="flex shrink items-center gap-x-2 overflow-hidden" placeholder={props.placeholder} render={<div></div>}>
               {(value?: SelectItem) =>
                  value ? (
                     <>
                        {value.icon}
                        <span className="truncate">{value.text}</span>
                     </>
                  ) : (
                     <span className="text-text/80">{props.placeholder}</span>
                  )
               }
            </Select.Value>
            <Select.Icon
               className={(state) =>
                  clsx("ml-auto flex h-6 w-6 shrink-0 items-center justify-center transition-transform", state.open && "rotate-180")
               }
            >
               <IconMingcuteDownFill className="text-primary-500 h-6 w-6" />
            </Select.Icon>
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
   const sideOffset = props.sideOffset ?? 4;
   const alignOffset = props.alignOffset ?? 0;

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

function Item(props: { item: SelectItem; children?: ReactNode }) {
   return (
      <Select.Item
         value={props.item}
         className="group data-highlighted:bg-surface data-selected:bg-surface/50 flex cursor-pointer items-center gap-x-2 px-2 py-2 text-white/70 data-selected:text-white"
      >
         {props.item.icon}
         <Select.ItemText className="wrap-anywhere">{props.item.text}</Select.ItemText>
         {props.children}
         <Select.ItemIndicator
            keepMounted
            className={(state) =>
               clsx("text-primary-500 ml-auto flex size-5 shrink-0 items-center justify-center transition-opacity", !state.selected && "opacity-0")
            }
         >
            <IconMingcuteCheckFill className="size-5" />
         </Select.ItemIndicator>
      </Select.Item>
   );
}

function Label(props: { children?: ReactNode }) {
   const dropdownContext = useContext(SelectContext);
   return <HuginnLabel htmlFor={dropdownContext.id}>{props.children}</HuginnLabel>;
}

HuginnSelect.Label = Label;
HuginnSelect.List = List;
HuginnSelect.ItemsWrapper = ItemsWrapper;
HuginnSelect.Item = Item;
