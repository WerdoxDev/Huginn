import type { HuginnButtonProps } from "@/types.ts";
import { clsx } from "@nick/clsx";

export default function HuginnButton(props: HuginnButtonProps) {
	return (
		<button
			className={clsx(
				"select-none rounded-md outline-none transition-colors hover:bg-opacity-80 enabled:active:bg-opacity-50 disabled:cursor-not-allowed disabled:bg-opacity-50",
				props.className,
			)}
			type={props.type}
			disabled={props.disabled}
			onClick={props.onClick}
		>
			<div className={clsx("text-text opacity-100", props.innerClassName)}>{props.children}</div>
		</button>
	);
}
