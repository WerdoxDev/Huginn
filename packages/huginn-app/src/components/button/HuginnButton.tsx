import clsx from "clsx";
import { useMemo } from "react";
import type { HuginnButtonProps } from "@/types";

export default function HuginnButton(props: HuginnButtonProps) {
	const styleClassNames = useMemo(
		() =>{
         const split = props.className?.split(" ");
			return split?.includes("bg-primary-700")
				? "hover:bg-primary-800 focus:bg-primary-800 enabled:active:bg-primary-900 disabled:bg-primary-900"
				: split?.includes("bg-surface")
					? "hover:bg-surface/80 focus:bg-surface/80 enabled:active:bg-surface/50 disabled:bg-surface/50"
					: split?.includes("bg-surface-alt")
						? "hover:bg-surface-alt/80 focus:bg-surface-alt/80 enabled:active:bg-surface-alt/50 disabled:bg-surface-alt/50"
						: split?.includes("bg-surface-deep")
							? "hover:bg-surface-deep/80 focus:bg-surface-deep/80 enabled:active:bg-surface-deep/50 disabled:bg-surface-deep/50"
							: ""
                     },
		[props.className],
	);
	return (
		<button
			className={clsx(
				"cursor-pointer select-none rounded-md outline-hidden transition-colors disabled:cursor-not-allowed",
				props.className,
				styleClassNames,
			)}
			type={props.type}
			disabled={props.disabled}
			onClick={props.onClick}
		>
			<div className={clsx("text-text opacity-100", props.innerClassName)}>{props.children}</div>
		</button>
	);
}
