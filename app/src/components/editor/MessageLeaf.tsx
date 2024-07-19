import { useState } from "react";
import { RenderLeafProps } from "slate-react";

export default function MessageLeaf(props: RenderLeafProps) {
   if (props.leaf.bold) {
      return (
         <span className="font-bold" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.italic) {
      return (
         <span className="italic" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.underline) {
      return (
         <span className="underline" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.spoiler) {
      return <SpoilerLeaf {...props} />;
   }

   if (props.leaf.mark) {
      return (
         <span className="text-white/50" {...props.attributes}>
            {props.children}
         </span>
      );
   }
   return <span {...props.attributes}>{props.children}</span>;
}

function SpoilerLeaf(props: RenderLeafProps) {
   const [hidden, setHidden] = useState(true);

   return (
      <span
         className={`inline-block rounded-sm px-0.5 transition-colors ${hidden ? "cursor-pointer bg-tertiary text-tertiary" : "bg-white/20"}`}
         {...props.attributes}
         onClick={() => setHidden(false)}
      >
         {props.children}
      </span>
   );
}
