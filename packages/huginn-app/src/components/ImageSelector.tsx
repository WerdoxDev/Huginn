import clsx from "clsx";
import type { ReactNode } from "react";

export default function ImageSelector(props: {
	className?: string;
	editButtonClassName?: string;
	deleteButtonClassName?: string;
	buttonsClassName?: string;
	data?: string | null;
	size?: string;
	children?: ReactNode;
	onDelete?: () => void;
	onSelected?: (data: string, mimeType: string) => void;
}) {
	const { size = "7rem" } = props;

	function openFileDialog() {
		const input = document.createElement("input");
		input.type = "file";
		input.multiple = false;
		input.accept = "image/png,image/jpeg,image/webp,image/gif";

		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];

			if (!file) {
				return;
			}

			const reader = new FileReader();
			reader.readAsDataURL(file);

			reader.onload = (readerEvent) => {
				const content = readerEvent.target?.result;
				if (typeof content === "string") {
					props.onSelected?.(content, file.type);
					// modalsDispatch({ imageCrop: { isOpen: true, originalImageData: content, mimeType: file.type } });
				}
			};
		};

		input.click();
	}

	function remove(e: React.MouseEvent) {
		e.stopPropagation();
		props.onDelete?.();
	}

	return (
		<div className={clsx("flex w-max shrink-0 flex-col rounded-lg bg-secondary p-3", props.className)}>
			{props.children}
			<div onClick={openFileDialog} className="group relative cursor-pointer overflow-hidden rounded-full bg-black">
				{props.data ? (
					<img alt="editing-user-avatar" className="object-cover" style={{ width: size, height: size }} src={props.data} />
				) : (
					<div className="bg-primary" style={{ width: size, height: size }} />
				)}
			</div>
			<div className={clsx("mt-3 flex w-full items-center justify-center gap-x-0.5", props.buttonsClassName)}>
				<Tooltip>
					<Tooltip.Trigger
						onClick={openFileDialog}
						type="button"
						className={clsx("flex w-full justify-center rounded-l-md bg-background py-1.5 hover:bg-primary", props.editButtonClassName)}
					>
						<IconMingcuteEdit2Fill className="size-5 text-white" />
					</Tooltip.Trigger>
					<Tooltip.Content>Edit</Tooltip.Content>
				</Tooltip>
				<Tooltip>
					<Tooltip.Trigger
						onClick={remove}
						type="button"
						className={clsx("group flex w-full justify-center rounded-r-md bg-error/10 py-1.5 hover:bg-error/100", props.deleteButtonClassName)}
					>
						<IconMingcuteDelete3Fill className="size-5 text-error group-hover:text-white" />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<span className="text-error">Delete</span>
					</Tooltip.Content>
				</Tooltip>
			</div>
		</div>
	);
}
