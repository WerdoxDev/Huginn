import type { ReactNode } from "react";

export default function InlineCodeElement(props: { children?: ReactNode }) {
   return (
      <div className="border-text/20 bg-surface-deep font-ubuntu relative inline-block rounded-sm border px-1 transition-colors">
         <span className="pointer-events-none">{props.children}</span>
      </div>
   );
}
