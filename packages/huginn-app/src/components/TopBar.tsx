import type { MouseEvent, ReactNode } from "react";

import clsx from "clsx";

export default function TopBar(props: { children?: ReactNode; onClick?: (e: MouseEvent) => void; className?: string }) {
   return (
      <div onClick={props.onClick} className="z-10 shadow-lg">
         <div className={clsx("lg:h-topbar min-h-topbar bg-surface-deep flex shrink-0 items-center px-3", props.className)}>
            {props.children}
            {/* <div className="flex w-full items-center">{props.children}</div> */}
         </div>
         <div className="bg-surface h-0.5 shrink-0" />
      </div>
   );
}
