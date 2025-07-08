import clsx from "clsx";
import type { ReactNode } from "react";

export default function AttentionIndicator(props: { className?: string; children?: ReactNode }) {
	return (
		<div className={clsx("absolute h-5 w-5 rounded-full bg-negative-100 font-bold text-sm", props.className)}>
			<div className="text-center text-white">{props.children}</div>
		</div>
	);
}
