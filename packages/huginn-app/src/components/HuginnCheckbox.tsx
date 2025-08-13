import { Checkbox } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

export default function HuginnCheckbox(props: {
   checked?: boolean;
   onChange?: (checked: boolean) => void;
   children?: ReactNode;
   className?: string;
}) {
   return (
      <Checkbox checked={props.checked} onChange={props.onChange} className={clsx("group flex cursor-pointer items-center justify-center gap-x-2.5")}>
         <div
            className={clsx(
               "bg-surface-alt group-hover:bg-surface-deep group-data-checked:bg-primary-700 group-data-checked:hover:bg-primary-800 group-data-checked:ring-0 flex size-6 items-center justify-center rounded-md p-1 ring-1 ring-white/20",
               props.className,
            )}
         >
            <IconMingcuteCheckFill className="group-data-checked:opacity-100 text-white opacity-0" />
         </div>

         {props.children && <div className="text-text">{props.children}</div>}
      </Checkbox>
   );
}
