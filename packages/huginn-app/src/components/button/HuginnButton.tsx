import clsx from "clsx";
import { useMemo } from "react";
import type { HuginnButtonProps } from "@/types";

export default function HuginnButton(props: HuginnButtonProps) {
	const styleClassNames = useMemo(
		() =>
			props.className?.includes("bg-primary")
				? "hover:bg-primary/80 focus:bg-primary/80 enabled:active:bg-primary/50 disabled:bg-primary/50"
				: props.className?.includes("bg-background")
					? "hover:bg-background/80 focus:bg-background/80 enabled:active:bg-background/50 disabled:bg-background/50"
					: props.className?.includes("bg-secondary")
						? "hover:bg-secondary/80 focus:bg-secondary/80 enabled:active:bg-secondary/50 disabled:bg-secondary/50"
						: props.className?.includes("bg-tertiary")
							? "hover:bg-tertiary/80 focus:bg-tertiary/80 enabled:active:bg-tertiary/50 disabled:bg-tertiary/50"
							: "",
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
