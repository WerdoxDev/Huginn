import type { MouseEvent, ReactNode } from "react";

export default function TopBar(props: { children?: ReactNode; onClick?: (e: MouseEvent) => void }) {
   return (
      <div onClick={props.onClick}>
         <div className="h-topbar bg-surface-deep flex shrink-0 items-center px-3">
            <div className="flex w-full items-center">{props.children}</div>
         </div>
         <div className="h-0.5 shrink-0 bg-white/10" />
      </div>
   );
}
