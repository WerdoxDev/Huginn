import type { HuginnButtonProps, HuginnInputProps } from "@/types";
import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";

export default function AddFriendInput(
	props: HuginnInputProps & { onClick?: () => void; disabled?: boolean; buttonProps?: HuginnButtonProps; loading: boolean },
) {
	return (
		<>
			<div
				className={`bg-secondary flex w-full gap-x-2.5 overflow-hidden rounded-lg py-2.5 pl-4 pr-2.5 ring-1 ${props.className} ${props.status.code === "error" ? "ring-error" : props.status.code === "success" ? "ring-success" : "has-[:focus]:ring-primary ring-transparent"}`}
			>
				<input
					className="bg-secondary text-text placeholder-text/50 w-full outline-none"
					placeholder="e.g: Werdox"
					onChange={(e) => props.onChange?.(e.target)}
				/>
				<LoadingButton
					loading={props.loading}
					className="bg-primary whitespace-nowrap rounded-md h-8 w-64 text-sm font-medium"
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
