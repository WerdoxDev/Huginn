import type { RenderElementProps } from "slate-react";

export default function InlineCodeElement(props: RenderElementProps) {
   return (
      <div className="font-ubuntu bg-surface-deep border-text/20 relative inline-block rounded-sm border px-1 transition-colors">
         <span {...props.attributes} className="pointer-events-none">
            {props.children}
         </span>
      </div>
   );
}
