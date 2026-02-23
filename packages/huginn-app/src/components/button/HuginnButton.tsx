import clsx from "clsx";
import type { HuginnButtonProps } from "@/types";

const colors = {
   none: "",
   primary: "bg-primary-700 hover:bg-primary-800 enabled:active:bg-primary-900 disabled:bg-primary-900",
   surface: "bg-surface hover:bg-surface/80 enabled:active:bg-surface/50 disabled:bg-surface/50",
   "surface-alt": "bg-surface-alt hover:bg-surface-alt/80 enabled:active:bg-surface-alt/50 disabled:bg-surface-alt/50",
   "surface-deep": "bg-surface-deep hover:bg-surface-deep/80 enabled:active:bg-surface-deep/50 disabled:bg-surface-deep/50",
   positive: "bg-positive-300 hover:bg-positive-300/80 enabled:active:bg-positive-300/50 disabled:bg-positive-300/50",
   ghost: "bg-transparent hover:underline",
};

export default function HuginnButton(props: HuginnButtonProps) {
   // const colorClassNames = useMemo(() => {
   //    switch (props.color) {
   //       case "primary":
   //          return "bg-primary-700 hover:bg-primary-800 enabled:active:bg-primary-900 disabled:bg-primary-900";
   //       case "surface":
   //          return "bg-surface hover:bg-surface/80  enabled:active:bg-surface/50 disabled:bg-surface/50";
   //       case "surface-alt":
   //          return "bg-surface-alt hover:bg-surface-alt/80  enabled:active:bg-surface-alt/50 disabled:bg-surface-alt/50";
   //       case "surface-deep":
   //          return "bg-surface-deep hover:bg-surface-deep/80  enabled:active:bg-surface-deep/50 disabled:bg-surface-deep/50";
   //       default:
   //          return "";
   //    }
   // }, [props.className]);

   return (
      <button
         className={clsx(
            "cursor-pointer rounded-md text-white opacity-100 outline-hidden transition-colors select-none disabled:cursor-not-allowed",
            props.className,
            colors[props.color ?? "none"],
         )}
         type={props.type}
         disabled={props.disabled}
         onClick={props.onClick}
      >
         {/* <div className={clsx("text-white opacity-100", props.innerClassName)}>{props.children}</div> */}
         {props.children}
      </button>
   );
}
