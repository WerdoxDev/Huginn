import type { HuginnButtonProps, HuginnInputProps } from "@/types.ts";
import LoadingButton from "@components/button/LoadingButton.tsx";
import { clsx } from "@nick/clsx";

export default function AddFriendInput(
	props: HuginnInputProps & { onClick?: () => void; disabled?: boolean; buttonProps?: HuginnButtonProps; loading: boolean },
) {
	return (
		<>
			<div
				className={clsx(
					"flex w-full gap-x-2.5 overflow-hidden rounded-lg bg-secondary py-2.5 pr-2.5 pl-4 ring-1",
					props.className,
					props.status.code === "error"
						? "ring-error"
						: props.status.code === "success"
							? "ring-success"
							: "ring-transparent has-[:focus]:ring-primary",
				)}
			>
				<input
					className="w-full bg-secondary text-text placeholder-text/50 outline-none"
					placeholder="e.g: Werdox"
					onChange={(e) => props.onChange?.(e.target)}
				/>
				<LoadingButton
					loading={props.loading}
					className="h-8 w-64 whitespace-nowrap rounded-md bg-primary font-medium text-sm"
					disabled={props.disabled}
					onClick={() => props.onClick?.()}
				>
					Send Friend Request
				</LoadingButton>
			</div>
			{props.status.text && (
				<div className={`mt-2 text-sm ${props.status.code === "error" ? "text-error" : "text-success"}`}>{props.status.text}</div>
			)}
		</>
	);
}
