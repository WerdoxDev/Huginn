import type { ComponentPropsWithRef } from "react";

import clsx from "clsx";

export type HuginnLoadingIconProps = ComponentPropsWithRef<"svg">;

export default function HuginnLoadingIcon({ className, ...props }: HuginnLoadingIconProps) {
   return (
      <svg
         {...props}
         aria-hidden={props["aria-label"] ? undefined : true}
         viewBox="0 0 24 24"
         fill="none"
         className={clsx("text-text animate-spin", className)}
      >
         <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
   );
}
