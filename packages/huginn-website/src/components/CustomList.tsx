import { Listbox } from "@headlessui/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

type ListOption = {
   text: string;
   icon: string;
   disabled: boolean;
   hidden: boolean;
};

type CustomListProps = {
   options: ListOption[];
   default: string;
   className?: string;
   onChanged?: (value: string) => void;
};

export default function CustomList({ options, default: defaultValue, className, onChanged }: CustomListProps) {
   const initialOption = useMemo(() => {
      return options.find((option) => option.text.trim().toLowerCase() === defaultValue) ?? options[0] ?? null;
   }, [defaultValue, options]);

   const [selectedOption, setSelectedOption] = useState<ListOption | null>(initialOption);

   return (
      <Listbox
         value={selectedOption}
         onChange={(option) => {
            setSelectedOption(option);
            onChanged?.(option.text.trim().toLowerCase());
         }}
      >
         <div className="relative mx-2 select-none">
            <Listbox.Button className={`bg-secondary flex items-center rounded-md px-2 py-1 ${className ?? ""}`.trim()}>
               <Icon icon={selectedOption?.icon ?? "mdi:cross"} className="mr-1" />
               {selectedOption?.text}
               <Icon icon="gridicons:dropdown" className="ml-auto" />
            </Listbox.Button>

            <Listbox.Options className="bg-secondary absolute mt-1 w-full overflow-hidden rounded-md shadow-lg">
               {options.map((option) => (
                  <Listbox.Option
                     key={option.text}
                     value={option}
                     disabled={option.disabled}
                     className={({ active, disabled }) =>
                        `flex cursor-pointer items-center px-2 py-1 pr-9 ${
                           active && !disabled ? "bg-black/50" : ""
                        } ${disabled ? "text-text/50 cursor-not-allowed" : ""} ${option.hidden ? "hidden" : ""}`
                     }
                  >
                     <Icon icon={option.icon} className="mr-1" />
                     {option.text}
                  </Listbox.Option>
               ))}
            </Listbox.Options>
         </div>
      </Listbox>
   );
}
