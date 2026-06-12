import type { RenderLeafProps } from "slate-react";

import clsx from "clsx";

export default function EditorLeaf(props: RenderLeafProps) {
   if (props.leaf.mark) {
      return (
         <span className="text-white/50" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (
      props.leaf.bold ||
      props.leaf.italic ||
      props.leaf.underline ||
      props.leaf.spoiler ||
      props.leaf.link ||
      props.leaf.codeToken ||
      props.leaf.codeLanguage ||
      props.leaf.codespan ||
      props.leaf.strikethrough
   ) {
      return (
         <span
            className={clsx(
               props.leaf.bold && "font-bold",
               props.leaf.italic && "italic",
               props.leaf.underline && "underline",
               props.leaf.spoiler && "rounded-sm bg-white/20 px-0.5",
               props.leaf.strikethrough && "line-through",
               props.leaf.codespan && "bg-surface font-ubuntu rounded-sm px-0.5 py-0.5",
               props.leaf.link && "text-primary-500",
               props.leaf.codeToken,
               props.leaf.codeToken && "font-ubuntu text-sm",
               props.leaf.codeLanguage && "text-primary-500",
            )}
            spellCheck={!props.leaf.codeToken}
            {...props.attributes}
         >
            {props.children}
         </span>
      );
   }

   return <span {...props.attributes}>{props.children}</span>;
}
