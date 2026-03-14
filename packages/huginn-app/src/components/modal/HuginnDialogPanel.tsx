import type React from "react";
import type { ReactNode } from "react";

import { DialogPanel } from "@headlessui/react";
import clsx from "clsx";

export default function HuginnDialogPanel(props: { className?: string; style?: React.CSSProperties; children?: ReactNode; headless?: boolean }) {
   return (
      <DialogPanel
         transition
         style={props.style}
         className={clsx(
            "relative transform overflow-hidden rounded-t-xl transition duration-200 data-closed:translate-y-1/2 data-closed:opacity-0 data-closed:blur-xl lg:data-closed:translate-none lg:data-closed:scale-90",
            !props.headless && "border-primary-800 bg-surface border-t-2 lg:rounded-xl lg:border-2",
            props.className,
         )}
      >
         {props.children}
      </DialogPanel>
   );
}
