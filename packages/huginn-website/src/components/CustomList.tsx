import { HuginnSelect } from "@huginn/frontend-shared";
import { useMemo, useState } from "react";

import type { IconComponent } from "@/types";

type ListOption = {
   text: string;
   icon: IconComponent;
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
   const initialOption = useMemo(() => options.find((option) => option.text.trim().toLowerCase() === defaultValue) ?? options[0], [defaultValue, options]);
   const [selectedOption, setSelectedOption] = useState(initialOption);
   const SelectedIcon = selectedOption?.icon ?? IconMdiClose;

   if (!selectedOption) return null;

   return (
      <HuginnSelect
         className="relative mx-2"
         selected={{ text: selectedOption.text, value: selectedOption.text }}
         onChange={(item) => {
            const option = options.find((candidate) => candidate.text === item.value);
            if (!option) return;
            setSelectedOption(option);
            onChanged?.(option.text.trim().toLowerCase());
         }}
      >
         <HuginnSelect.List className={className} startIcon={<SelectedIcon className="mr-1" />} />
         <HuginnSelect.ItemsWrapper>
            {options.map((option) => {
               const OptionIcon = option.icon;
               return (
                  <HuginnSelect.Item
                     key={option.text}
                     item={{ text: option.text, value: option.text, icon: <OptionIcon className="mr-1" /> }}
                     disabled={option.disabled}
                     className={option.hidden ? "hidden" : undefined}
                  />
               );
            })}
         </HuginnSelect.ItemsWrapper>
      </HuginnSelect>
   );
}
