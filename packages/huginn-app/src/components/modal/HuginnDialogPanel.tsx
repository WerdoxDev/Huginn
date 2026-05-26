import type React from "react";
import type { ReactNode } from "react";

import { Dialog } from "@base-ui/react";
import clsx from "clsx";

export default function HuginnDialogPanel(props: { className?: string; style?: React.CSSProperties; children?: ReactNode; headless?: boolean }) {
   return (
      <Dialog.Popup
         style={props.style}
         className={clsx(
            "relative transform overflow-hidden transition-[opacity_blur_transform] duration-200 outline-none data-ending-style:translate-y-1/2 data-ending-style:opacity-0 data-ending-style:blur-xl data-starting-style:translate-y-1/2 data-starting-style:opacity-0 data-starting-style:blur-xl lg:data-ending-style:translate-none lg:data-ending-style:scale-90 lg:data-starting-style:translate-none lg:data-starting-style:scale-90",
            !props.headless && "border-primary-800 bg-surface rounded-t-xl border-t-2 lg:rounded-xl lg:border-2",
            props.className,
         )}
      >
         {props.children}
      </Dialog.Popup>
   );
}
