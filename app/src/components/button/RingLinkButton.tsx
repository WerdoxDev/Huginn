import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export default function RingLink(props: { children?: ReactNode; preload?: false | "intent"; to?: string; className?: string }) {
   return (
      <Link
         activeProps={{ className: "bg-primary text-text" }}
         inactiveProps={{ className: "text-text/70 hover:bg-primary hover:text-text/100" }}
         to={props.to}
         className={`rounded-full uppercase ring-[1.5px] ring-primary  ${props.className}`}
      >
         {props.children}
      </Link>
   );
}
