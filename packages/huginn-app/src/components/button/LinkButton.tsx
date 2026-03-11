import clsx from "clsx";
import type { MouseEventHandler, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

export default function LinkButton(
   props: LinkProps & {
      href?: string;
      onClick?: MouseEventHandler<HTMLButtonElement>;
      className?: string;
      children?: ReactNode;
   },
) {
   return props.to ? (
      <div className={clsx("text-primary-500 w-max select-none", props.className)}>
         <Link className="hover:underline" to={props.to} viewTransition={props.viewTransition}>
            {props.children}
         </Link>
      </div>
   ) : props.href ? (
      <a className={clsx("text-primary-500 select-none hover:underline", props.className)} href={props.href} target="_blank" rel="noreferrer">
         {props.children}
      </a>
   ) : (
      <button className={clsx("text-primary-500 select-none hover:underline", props.className)} type="button" onClick={props.onClick}>
         {props.children}
      </button>
   );
}
