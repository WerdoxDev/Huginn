import clsx from "clsx";

import type { HuginnButtonProps } from "@/types";

const colors = {
   none: "",
   primary: "bg-primary-700 hover:bg-primary-800 enabled:active:bg-primary-900 disabled:bg-primary-900",
   surface: "bg-surface hover:bg-surface/80 enabled:active:bg-surface/50 disabled:bg-surface/50",
   "surface-alt": "bg-surface-alt hover:bg-surface-alt/80 enabled:active:bg-surface-alt/50 disabled:bg-surface-alt/50",
   "surface-deep": "bg-surface-deep hover:bg-surface-deep/80 enabled:active:bg-surface-deep/50 disabled:bg-surface-deep/50",
   positive: "bg-positive-500 hover:bg-positive-500/80 enabled:active:bg-positive-500/50 disabled:bg-positive-500/50",
   negative: "bg-negative-500 hover:bg-negative-500/80 enabled:active:bg-negative-500/50 disabled:bg-negative-500/50",
   caution: "bg-caution-500 hover:bg-caution-500/80 enabled:active:bg-caution-500/50 disabled:bg-caution-500/50",
   ghost: "bg-transparent hover:underline",
};

export default function HuginnButton(props: HuginnButtonProps) {
   const { color, className, children, disabled, type, onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, style, ...rest } = props;

   return (
      <button
         className={clsx(
            "cursor-pointer rounded-md text-white opacity-100 outline-hidden transition-colors select-none disabled:cursor-not-allowed",
            className,
            colors[color ?? "none"],
         )}
         type={type}
         style={style}
         disabled={disabled}
         onClick={onClick}
         onPointerDown={onPointerDown}
         onPointerUp={onPointerUp}
         onPointerMove={onPointerMove}
         onPointerCancel={onPointerCancel}

         {...rest}
      >
         {children}
      </button>
   );
}
