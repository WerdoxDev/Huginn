import clsx from "clsx";
import { useState, type ReactNode } from "react";

export default function SpoilerElement(props: { children?: ReactNode }) {
   const [hidden, setHidden] = useState(true);

   return (
      <div
         className={clsx(
            "relative inline-block rounded-sm px-0.5 transition-colors",
            hidden ? "bg-surface-deep text-surface-deep cursor-pointer" : "bg-text/20",
         )}
         onClick={(e) => {
            if (hidden) e.stopPropagation();
            setHidden(false);
         }}
      >
         <span id="content" className={clsx(hidden && "pointer-events-none")}>
            {props.children}
         </span>
      </div>
   );
}
