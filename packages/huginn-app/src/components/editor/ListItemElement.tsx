import type { ReactNode } from "react";

export default function ListItemElement(props: { children?: ReactNode; ordered?: boolean }) {
   return <li className="w-max">{props.children}</li>;
}
