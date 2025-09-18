import clsx from "clsx";
import { useState } from "react";
import type { RenderElementProps } from "slate-react";

export default function SpoilerElement(props: RenderElementProps) {
   const [hidden, setHidden] = useState(true);

   return (
      <div
         className={clsx(
            "relative inline-block rounded-sm px-0.5 transition-colors",
            hidden ? "bg-surface-deep text-surface-deep cursor-pointer" : "bg-text/20",
         )}
         onClick={() => {
            setHidden(false);
         }}
      >
         <span {...props.attributes} className={clsx(hidden && "pointer-events-none")}>
            {props.children}
         </span>
      </div>
   );
}
