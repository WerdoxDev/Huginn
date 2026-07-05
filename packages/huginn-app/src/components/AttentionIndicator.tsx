import type { ReactNode } from "react";

import clsx from "clsx";

export default function AttentionIndicator(props: { className?: string; children?: ReactNode }) {
   return (
      <div className={clsx("bg-surface absolute flex h-6 w-6 items-center justify-center rounded-full p-1", props.className)}>
         <div className={clsx("bg-negative-500 flex h-full w-full items-center justify-center rounded-full text-xs")}>
            <div className="text-center text-white">{props.children}</div>
         </div>
      </div>
   );
}
