import { DialogPanel } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

export default function HuginnDialogPanel(props: { className?: string; children?: ReactNode; headless?: boolean }) {
   return (
      <DialogPanel
         transition
         className={clsx(
            "relative transform overflow-hidden rounded-t-xl transition-[opacity_transform] duration-200 data-closed:translate-y-1/2 lg:data-closed:translate-none lg:data-closed:scale-90",
            !props.headless && "border-primary-800 bg-surface border-t-2 lg:rounded-xl lg:border-2",
            props.className,
         )}
      >
         {props.children}
      </DialogPanel>
   );
}
