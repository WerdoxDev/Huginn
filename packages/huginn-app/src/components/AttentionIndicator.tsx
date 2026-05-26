import type { ReactNode } from "react";

import clsx from "clsx";

export default function AttentionIndicator(props: { className?: string; children?: ReactNode }) {
   return (
      <div className={clsx("bg-negative-200 absolute flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold", props.className)}>
         <div className="text-center text-white">{props.children}</div>
      </div>
   );
}
