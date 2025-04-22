import type { ReactNode } from "react";

export default function GenericLabel(props: { children?: ReactNode }) {
	return <div className="mb-2 select-none font-medium text-text text-xs uppercase opacity-90">{props.children}</div>;
}
