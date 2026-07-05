import clsx from "clsx";
import { type ReactNode } from "react";

import type { FormattedText } from "@/index";

export default function MessageLeaf(props: { children?: ReactNode } & FormattedText) {
   if (props.mark) {
      return <span className="text-white/50">{props.children}</span>;
   }

   if (props.bold || props.italic || props.underline || props.strikethrough) {
      return (
         <span
            className={clsx(
               props.bold && "font-bold",
               props.italic && "italic",
               props.underline && "underline",
               props.strikethrough && "line-through",
               // isRtl && "[unicode-bidi:plaintext]",
            )}
         >
            {props.children}
         </span>
      );
   }

   return <span>{props.children}</span>;
}
