import type { ReactNode } from "react";

import clsx from "clsx";

export default function AttentionIndicator(props: { className?: string; children?: ReactNode }) {
   return (
      <div className={clsx("bg-negative-100 absolute h-5 w-5 rounded-full text-sm font-bold", props.className)}>
         <div className="text-center text-white">{props.children}</div>
      </div>
   );
}
