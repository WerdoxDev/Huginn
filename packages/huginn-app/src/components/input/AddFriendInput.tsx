import LoadingButton from "@components/button/LoadingButton";
import clsx from "clsx";
import type { HuginnButtonProps, HuginnInputProps } from "@/types";

export default function AddFriendInput(
	props: HuginnInputProps & { onClick?: () => void; disabled?: boolean; buttonProps?: HuginnButtonProps; loading: boolean },
) {
	return (
		<>
			<div
				className={clsx(
					"flex w-full gap-x-2.5 overflow-hidden rounded-lg bg-surface-alt py-2.5 pr-2.5 pl-4 ring-1",
					props.className,
					props.status.code === "error"
						? "ring-negative-100"
						: props.status.code === "success"
							? "ring-positive-100"
							: "ring-transparent has-focus:ring-primary-700",
				)}
			>
				<input
					className="w-full bg-surface-alt text-text placeholder-text/50 outline-hidden"
					placeholder="e.g: Werdox"
					onChange={props.onChange}
				/>
				<LoadingButton
					iconClassName="size-6!"
					loading={props.loading}
					className="h-8 w-64 whitespace-nowrap rounded-md bg-primary-700 font-medium text-sm"
					disabled={props.disabled}
					onClick={() => props.onClick?.()}
				>
					Send Friend Request
				</LoadingButton>
			</div>
			{props.status.text && (
				<div className={`mt-2 text-sm ${props.status.code === "error" ? "text-negative-100" : "text-positive-100"}`}>{props.status.text}</div>
			)}
		</>
	);
}
