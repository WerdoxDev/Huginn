import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export default function LinkButton(props: { className?: string; to?: string; children?: ReactNode; onClick?: () => void }) {
   return props.to ? (
      <div className={`w-max select-none text-sm text-link ${props.className}`}>
         <Link className="hover:underline" to={props.to}>
            {props.children}
         </Link>
      </div>
   ) : (
      <button
         className="mb-5 mt-1 select-none text-sm text-link hover:underline"
         type="button"
         onClick={() => props.onClick && props.onClick()}
      >
         {props.children}
      </button>
   );
}
