import type { ReactNode } from "react";

export default function GenericLabel(props: { children?: ReactNode }) {
   return <div className="text-text mb-2 text-xs font-medium uppercase opacity-90 select-none">{props.children}</div>;
}
