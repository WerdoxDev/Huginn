import clsx from "clsx";
import type { ReactNode } from "react";

export default function HuginnLabel(props: { children?: ReactNode; className?: string; htmlFor?: string }) {
   return (
      <label htmlFor={props.htmlFor} className={clsx("text-text mb-2 text-xs font-medium uppercase opacity-90 select-none", props.className)}>
         {props.children}
      </label>
   );
}
