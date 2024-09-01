import { DropboxItem } from "@/types";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { filterChildrenOfType } from "@lib/utils";
import { ReactNode } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export default function HuginnDropbox(props: {
   items: DropboxItem[];
   defaultIndex?: number;
   children?: ReactNode;
   onChange?: (value: DropboxItem) => void;
}) {
   const [selected, setSelected] = useState(props.items[props.defaultIndex ?? 0]);

   const filteredChildren = useMemo(() => {
      return {
         label: filterChildrenOfType(props.children, Label),
      };
   }, [props.children]);

   function onChange(value: DropboxItem) {
      setSelected(value);
      props.onChange && props.onChange(value);
   }

   return (
      <div className="flex flex-col">
         {filteredChildren.label && <HuginnDropbox.Label skipRender>{filteredChildren.label}</HuginnDropbox.Label>}
         <div className="bg-secondary w-52 rounded-lg">
            <Listbox value={selected} onChange={onChange}>
               <ListboxButton className="relative flex w-full items-center justify-between p-2.5 text-white">
                  {selected.name}
                  <IconMingcuteDownFill className="text-accent h-6 w-6" />
               </ListboxButton>
               <Transition
                  enter="duration-150 ease-out"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="duration-150 ease-in"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
               >
                  <ListboxOptions
                     anchor="bottom"
                     className="bg-secondary flex w-52 cursor-pointer flex-col rounded-lg p-1.5 transition [--anchor-gap:0.25rem]"
                  >
                     {props.items.map(item => (
                        <ListboxOption
                           key={item.id}
                           value={item}
                           className="hover:bg-background group flex items-center gap-x-1.5 rounded-md p-1.5 text-white"
                        >
                           <IconMingcuteCheckFill className="invisible size-5 group-data-[selected]:visible" />
                           {item.name}
                        </ListboxOption>
                     ))}
                  </ListboxOptions>
               </Transition>
            </Listbox>
         </div>
      </div>
   );
}

function Label(props: { children?: ReactNode; skipRender?: boolean }) {
   return !props.skipRender ? (
      <label className={`text-text mb-2 select-none text-xs font-medium uppercase opacity-90`}>{props.children}</label>
   ) : (
      props.children
   );
}

HuginnDropbox.Label = Label;
