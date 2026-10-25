import type { ReactNode } from "react";

import clsx from "clsx";

import type { HuginnSelectItem } from "../../types";

import HuginnMenu, { type HuginnMenuProps } from "./HuginnMenu";

export type HuginnIconSelectProps<T = string> = Omit<HuginnMenuProps, "children"> & {
   label: string;
   icon: ReactNode;
   options: readonly HuginnSelectItem<T>[];
   active?: boolean;
   disabled?: boolean;
   className?: string;
} & ({ multiple?: false; value: T; onChange: (value: NoInfer<T>) => void } | { multiple: true; value: readonly T[]; onChange: (value: NoInfer<T>[]) => void });

export default function HuginnIconSelect<T = string>(props: HuginnIconSelectProps<T>) {
   const { active, className, disabled, icon, multiple, onChange, options, value, ...menuProps } = props;
   const selectedOptions = options.filter((option) =>
      multiple ? value.some((selected) => Object.is(selected, option.value)) : Object.is(value, option.value),
   );

   return (
      <HuginnMenu {...menuProps}>
         <HuginnMenu.Trigger
            disabled={disabled}
            className={clsx(
               "hover:bg-surface-deep active:bg-surface-deep relative flex size-8 shrink-0 items-center justify-center rounded-md text-white transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50",
               className,
            )}
         >
            <span aria-hidden="true" className="flex items-center justify-center">
               {icon}
            </span>
            {active && <span aria-hidden="true" className="bg-primary-500 absolute top-1 right-1 size-1.5 rounded-full" />}
         </HuginnMenu.Trigger>
         <HuginnMenu.Content align="end" sideOffset={6} className="min-w-44">
            {options.map((option, index) => {
               const selected = selectedOptions.includes(option);
               return (
                  <HuginnMenu.Item
                     key={index}
                     label={option.text}
                     checked={multiple ? selected : undefined}
                     closeOnClick={!multiple}
                     onClick={() => {
                        if (multiple) onChange(selected ? value.filter((item) => !Object.is(item, option.value)) : [...value, option.value]);
                        else onChange(option.value);
                     }}
                  >
                     <span className="flex items-center gap-2">
                        {option.icon && <span aria-hidden="true">{option.icon}</span>}
                        {option.text}
                     </span>
                     <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={clsx("text-primary-500 size-5 shrink-0", !selected && "invisible")}>
                        <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                     </svg>
                  </HuginnMenu.Item>
               );
            })}
         </HuginnMenu.Content>
      </HuginnMenu>
   );
}
