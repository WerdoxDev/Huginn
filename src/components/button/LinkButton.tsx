import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export default function LinkButton(props: {
   className?: string;
   to?: string;
   href?: string;
   preload?: false | "intent";
   children?: ReactNode;
   onClick?: () => void;
}) {
   return props.to ? (
      <div className={`w-max select-none text-accent ${props.className}`}>
         <Link className="hover:underline" to={props.to} preload={props.preload}>
            {props.children}
         </Link>
      </div>
   ) : props.href ? (
      <a className={`${props.className} select-none text-accent hover:underline`} href={props.href} target="_blank">
         {props.children}
      </a>
   ) : (
      <button className={`${props.className} select-none text-accent hover:underline `} type="button" onClick={props.onClick}>
         {props.children}
      </button>
   );
}
