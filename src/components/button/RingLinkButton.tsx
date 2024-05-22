import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export default function RingLink(props: {
   children?: ReactNode;
   preload?: false | "intent";
   to?: string;
   active?: boolean;
   className?: string;
}) {
   return (
      <Link
         to={props.to}
         className={`rounded-full uppercase ring-1 ring-primary ${props.active ? "bg-primary  text-secondary" : "text-text/70 hover:bg-primary hover:text-secondary"} ${props.className}`}
      >
         {props.children}
      </Link>
   );
}
