import type { FormattedText } from "@/index";
import clsx from "clsx";
import type { ReactNode } from "react";

export default function MessageLeaf(props: { children?: ReactNode } & FormattedText) {
   if (props.mark) {
      return <span className="text-white/50">{props.children}</span>;
   }

   if (props.bold || props.italic || props.underline) {
      return (
         <span className={clsx(props.bold && "font-bold", props.italic && "italic", props.underline && "underline")}>{props.children}</span>
      );
   }

   return <span>{props.children}</span>;
}
