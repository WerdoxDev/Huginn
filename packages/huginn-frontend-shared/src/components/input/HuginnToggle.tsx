import clsx from "clsx";
import { createContext, type MouseEvent, type ReactNode, useContext, useId } from "react";

export type HuginnToggleProps = {
   checked: boolean;
   onChange?: (checked: boolean) => void;
   children?: ReactNode;
   className?: string;
   disabled?: boolean;
};

const ToggleContext = createContext<{ id: string; checked: boolean; disabled: boolean; onChange?: (checked: boolean) => void }>({
   id: "",
   checked: false,
   disabled: false,
});

export default function HuginnToggle({ checked, children, className, disabled = false, onChange }: HuginnToggleProps) {
   const id = useId();

   return (
      <ToggleContext.Provider value={{ id, checked, disabled, onChange }}>
         <div className={clsx("flex", className)}>{children}</div>
      </ToggleContext.Provider>
   );
}

function Input({
   children,
   className,
   innerClassName,
   onClick,
}: {
   className?: string;
   children?: ReactNode;
   innerClassName?: string;
   onClick?: (event: MouseEvent) => void;
}) {
   const context = useContext(ToggleContext);

   return (
      <button
         id={context.id}
         type="button"
         role="switch"
         aria-checked={context.checked}
         disabled={context.disabled}
         onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) context.onChange?.(!context.checked);
         }}
         className={clsx("group flex w-full cursor-pointer items-center justify-between disabled:cursor-not-allowed", className)}
         data-checked={context.checked ? "" : undefined}
      >
         <span className="text-text text-xs font-medium uppercase opacity-90 select-none">{children}</span>
         <span
            className={clsx(
               "bg-surface-alt group-data-checked:bg-primary-700 relative flex h-7 w-12 items-center justify-center rounded-full p-1 ring-white/20 transition-colors",
               innerClassName,
            )}
         >
            <span className="absolute left-0.5 size-5 translate-x-0.5 rounded-full bg-white transition-transform group-data-checked:translate-x-5.5" />
         </span>
      </button>
   );
}

HuginnToggle.Input = Input;
