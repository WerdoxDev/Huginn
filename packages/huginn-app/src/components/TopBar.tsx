import type { ReactNode } from "react";

export default function TopBar(props: { children?: ReactNode }) {
   return (
      <div>
         <div className="bg-surface-deep flex h-16 shrink-0 items-center px-3">
            <div className="flex w-full items-center">{props.children}</div>
         </div>
         <div className="h-0.5 shrink-0 bg-white/10" />
      </div>
   );
}
