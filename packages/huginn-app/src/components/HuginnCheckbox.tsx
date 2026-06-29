import { Checkbox } from "@base-ui/react";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, useContext, useState, type ReactNode } from "react";

const CheckboxContext = createContext<{
   id: string;
   checked: boolean;
   onChange?: (checked: boolean) => void;
}>({
   id: "",
   checked: false,
});

export default function HuginnCheckbox(props: { checked: boolean; onChange?: (checked: boolean) => void; children?: ReactNode; className?: string }) {
   const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));

   return (
      <CheckboxContext.Provider value={{ id, checked: props.checked, onChange: props.onChange }}>
         <div className={clsx("flex", props.className)}>{props.children}</div>
      </CheckboxContext.Provider>
   );
}

function Input(props: { className?: string; children?: ReactNode; innerClassName?: string }) {
   const checkboxContext = useContext(CheckboxContext);
   return (
      <Checkbox.Root
         checked={checkboxContext.checked}
         onCheckedChange={checkboxContext.onChange}
         className={clsx("group flex w-full cursor-pointer items-center justify-between", props.className)}
      >
         <div className="text-text text-xs font-medium uppercase opacity-90 select-none">{props.children}</div>
         <div
            className={clsx(
               "bg-surface-alt group-data-checked:bg-primary-700! relative flex h-7 w-12 items-center justify-center rounded-full p-1 ring-white/20 transition-colors",
               props.innerClassName,
            )}
         >
            <div className="absolute left-0.5 size-5 translate-x-0.5 rounded-full bg-white transition-transform group-data-checked:translate-x-5.5"></div>
         </div>
      </Checkbox.Root>
   );
}

HuginnCheckbox.Input = Input;
