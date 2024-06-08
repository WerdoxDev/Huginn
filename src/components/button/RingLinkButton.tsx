import { Link, useRouter } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";

export default function RingLink(props: { children?: ReactNode; preload?: false | "intent"; to?: string; className?: string }) {
   const router = useRouter();

   const [active, setActive] = useState(false);

   useEffect(() => {
      setActive(props.to === router.state.location.pathname);
   }, [router.state.location.pathname]);
   return (
      <Link
         to={props.to}
         className={`rounded-full uppercase ring-[1.5px] ring-primary ${active ? "bg-primary text-text" : "text-text/70 hover:bg-primary hover:text-text/100"} ${props.className}`}
      >
         {props.children}
      </Link>
   );
}
