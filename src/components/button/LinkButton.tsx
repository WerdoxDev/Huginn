import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export default function LinkButton(props: {
   className?: string;
   to?: string;
   preload?: false | "intent";
   children?: ReactNode;
   onClick?: () => void;
}) {
   return props.to ? (
      <div className={`text-accent w-max select-none text-sm ${props.className}`}>
         <Link className="hover:underline" to={props.to} preload={props.preload}>
            {props.children}
         </Link>
      </div>
   ) : (
      <button className="text-accent mb-5 mt-1 select-none text-sm hover:underline" type="button" onClick={props.onClick}>
         {props.children}
      </button>
   );
}
