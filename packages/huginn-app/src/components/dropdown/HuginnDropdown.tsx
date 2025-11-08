import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { DropdownItem } from "@/types";

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
                     className="outline-hidden relative flex w-full cursor-pointer select-none items-center gap-x-1.5 overflow-hidden p-2 text-white"
                  >
                     {value?.icon}
                     <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">{value?.text}</span>
                     <IconMingcuteDownFill className={clsx("text-primary-500 ml-auto h-6 w-6 shrink-0 transition-transform", open && "rotate-180")} />
                  </ListboxButton>
                  {props.children}
               </div>
            )}
         </Listbox>
      </div>
   );
}

function ItemsWrapper(props: { className?: string; children?: ReactNode }) {
   return (
      <ListboxOptions
         modal={false}
         anchor="bottom"
         transition
         className={clsx(
            "scroll-alternative2 bg-surface-alt outline-primary-800 data-closed:translate-y-5 data-closed:opacity-0 overflow-y-scroll! flex flex-col gap-y-0.5 rounded-lg p-1 pr-0 outline transition [--anchor-gap:0.25rem] [--anchor-padding:1rem]",
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
         className="data-focus:bg-surface data-selected:bg-surface/50 group flex cursor-pointer items-center gap-x-2 rounded-md p-1.5 text-white"
      >
         {props.item.icon}
         <span className="wrap-anywhere">{props.item.text}</span>
         {props.children}
         <IconMingcuteCheckFill className="text-primary-500 group-data-selected:visible invisible ml-auto size-5 shrink-0" />
      </ListboxOption>
   );
}

function Label(props: { children?: ReactNode }) {
   const dropdownContext = useContext(DropdownContext);

   return (
      <label htmlFor={dropdownContext.id} className="text-text mb-2 select-none text-xs font-medium uppercase opacity-90">
         {props.children}
      </label>
   );
}

HuginnDropdown.Label = Label;
HuginnDropdown.List = List;
HuginnDropdown.ItemsWrapper = ItemsWrapper;
HuginnDropdown.Item = Item;
