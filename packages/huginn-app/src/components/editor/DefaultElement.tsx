import type { RenderElementProps } from "slate-react";

export default function DefaultElement(props: RenderElementProps) {
   return (
      <div {...props.attributes} className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
         {props.children}
      </div>
   );
}
