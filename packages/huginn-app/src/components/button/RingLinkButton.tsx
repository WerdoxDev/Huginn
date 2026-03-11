import { Link, useLocation, type LinkProps } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo } from "react";

export default function RingLink(props: LinkProps & { to: string; className?: string }) {
   const location = useLocation();
   const isActive = useMemo(() => location.pathname.includes(props.to), [location.pathname]);

   return (
      <Link
         {...props}
         className={clsx(
            "ring-primary-700 rounded-full uppercase ring-[1.5px]",
            props.className,
            isActive ? "bg-primary-700 text-text" : "text-text/70 hover:bg-primary-700 hover:text-text",
         )}
      >
         {props.children}
      </Link>
   );
}
