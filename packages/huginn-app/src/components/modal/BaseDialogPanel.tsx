import { DialogPanel } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

export default function BaseDialogPanel(props: { className?: string; children?: ReactNode; headless?: boolean }) {
   return (
      <DialogPanel
         transition
         className={clsx(
            "border-primary-800 lg:data-closed:scale-90 data-closed:translate-y-1/2 lg:data-closed:translate-none relative transform overflow-hidden transition-[opacity_transform] duration-200",
            !props.headless && "bg-surface rounded-t-xl border-t-2 lg:rounded-xl lg:border-2",
            props.className,
         )}
      >
         {props.children}
      </DialogPanel>
   );
}
