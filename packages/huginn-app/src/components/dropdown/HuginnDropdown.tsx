import { Listbox, ListboxButton, ListboxOption, ListboxOptions, type ListboxOptionsProps } from "@headlessui/react";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { DropdownItem } from "@/types";
import HuginnLabel from "@components/HuginnLabel";

const DropdownContext = createContext<{
   id: string;
   selected?: DropdownItem;
   defaultValue?: DropdownItem;
   onChange?: (value: DropdownItem) => void;
}>({
   id: "",
});

export default function HuginnDropdown(props: {
   children?: ReactNode;
   className?: string;
   value?: DropdownItem;
   onChange?: (value: DropdownItem) => void;
}) {
   const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));

   function onChange(value: DropdownItem) {
      props.onChange?.(value);
   }

   return (
      <DropdownContext.Provider value={{ id: id, selected: props.value, onChange: onChange, defaultValue: props.value }}>
         <div className={clsx("flex flex-col", props.className)}>{props.children}</div>
      </DropdownContext.Provider>
   );
}

function List(props: { className?: string; children?: ReactNode; onClick?: () => void; placeholder?: string }) {
   const dropdownContext = useContext(DropdownContext);

   return (
      <div className={clsx("bg-surface-alt w-52 rounded-lg", props.className)}>
         <Listbox
            value={
               dropdownContext.selected
                  ? dropdownContext.selected
                  : props.placeholder
                    ? { text: props.placeholder, value: "", icon: undefined }
                    : undefined
            }
            by="value"
            onChange={dropdownContext.onChange}
         >
            {({ open, value }) => (
               <div>
                  <ListboxButton
                     onClick={props.onClick}
                     className="relative flex w-full cursor-pointer items-center gap-x-1.5 overflow-hidden p-2 text-white outline-hidden select-none"
                  >
                     {value?.icon}
                     <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap">{value?.text}</span>
                     <IconMingcuteDownFill className={clsx("text-primary-500 ml-auto h-6 w-6 shrink-0 transition-transform", open && "rotate-180")} />
                  </ListboxButton>
                  {props.children}
               </div>
            )}
         </Listbox>
      </div>
   );
}

function ItemsWrapper(props: { className?: string; children?: ReactNode; anchor?: ListboxOptionsProps["anchor"] }) {
   return (
      <ListboxOptions
         modal={false}
         anchor={props.anchor ?? "bottom"}
         transition
         className={clsx(
            "scroll-surface scroll-super-thin bg-surface-alt outline-primary-800 flex flex-col overflow-y-auto rounded-lg outline transition [--anchor-gap:0.25rem] [--anchor-padding:1rem] data-closed:translate-y-5 data-closed:opacity-0",
            props.className,
         )}
      >
         {props.children}
      </ListboxOptions>
   );
}

function Item(props: { item: DropdownItem; children?: ReactNode }) {
   return (
      <ListboxOption
         value={props.item}
         className="data-focus:bg-surface data-selected:bg-surface/50 group flex cursor-pointer items-center gap-x-2 px-2 py-2 text-white/70 data-selected:text-white"
      >
         {props.item.icon}
         <span className="wrap-anywhere">{props.item.text}</span>
         {props.children}
         <IconMingcuteCheckFill className="text-primary-500 invisible ml-auto size-5 shrink-0 group-data-selected:visible" />
      </ListboxOption>
   );
}

function Label(props: { children?: ReactNode }) {
   const dropdownContext = useContext(DropdownContext);
   return <HuginnLabel htmlFor={dropdownContext.id}>{props.children}</HuginnLabel>;
}

HuginnDropdown.Label = Label;
HuginnDropdown.List = List;
HuginnDropdown.ItemsWrapper = ItemsWrapper;
HuginnDropdown.Item = Item;
