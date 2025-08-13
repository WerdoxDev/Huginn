import clsx from "clsx";
import { useMemo } from "react";
import type { HuginnButtonProps } from "@/types";

export default function HuginnButton(props: HuginnButtonProps) {
   const colorClassNames = useMemo(() => {
      switch (props.color) {
         case "primary":
            return "bg-primary-700 hover:bg-primary-800 enabled:active:bg-primary-900 disabled:bg-primary-900";
         case "surface":
            return "bg-surface hover:bg-surface/80  enabled:active:bg-surface/50 disabled:bg-surface/50";
         case "surface-alt":
            return "bg-surface-alt hover:bg-surface-alt/80  enabled:active:bg-surface-alt/50 disabled:bg-surface-alt/50";
         case "surface-deep":
            return "bg-surface-deep hover:bg-surface-deep/80  enabled:active:bg-surface-deep/50 disabled:bg-surface-deep/50";
         default:
            return "";
      }
   }, [props.className]);

   return (
      <button
         className={clsx(
            "outline-hidden cursor-pointer select-none rounded-md transition-colors disabled:cursor-not-allowed",
            props.className,
            colorClassNames,
         )}
         type={props.type}
         disabled={props.disabled}
         onClick={props.onClick}
      >
         <div className={clsx("text-text opacity-100", props.innerClassName)}>{props.children}</div>
      </button>
   );
}
