import { Checkbox } from "@headlessui/react";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

function Toggle(props: { className?: string; children?: ReactNode; innerClassName?: string }) {
   const checkboxContext = useContext(CheckboxContext);

   useEffect(() => {
      console.log(checkboxContext);
   }, []);
   return (
      <Checkbox
         checked={checkboxContext.checked}
         onChange={checkboxContext.onChange}
         className={clsx("group flex w-full cursor-pointer items-center justify-between", props.className)}
      >
         <div className="text-text select-none text-xs font-medium uppercase opacity-90">{props.children}</div>
         <div
            className={clsx(
               "bg-surface group-data-checked:bg-primary-700 relative flex h-5 w-12 items-center justify-center rounded-full p-1 ring-white/20 transition-colors",
               props.innerClassName,
            )}
         >
            <div className="group-data-checked:translate-x-7.5 absolute left-0 size-4 translate-x-0.5 rounded-full bg-white transition-transform"></div>
         </div>
      </Checkbox>
   );
}

// HuginnCheckbox.Label = Label;
HuginnCheckbox.Toggle = Toggle;
