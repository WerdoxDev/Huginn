import type { ComponentPropsWithRef } from "react";

import clsx from "clsx";

export type HuginnLabelProps = ComponentPropsWithRef<"label">;

export default function HuginnLabel({ className, ...props }: HuginnLabelProps) {
   return (
      <label {...props} className={clsx("text-text mb-2 flex shrink-0 items-center gap-x-1 text-xs font-medium uppercase opacity-90 select-none", className)} />
   );
}
