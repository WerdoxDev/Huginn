import type { ReactNode } from "react";

export default function InlineCodeElement(props: { children?: ReactNode }) {
   return (
      <div className="font-ubuntu bg-surface-deep border-text/20 relative inline-block rounded-sm border px-1 transition-colors">
         <span className="pointer-events-none">{props.children}</span>
      </div>
   );
}
