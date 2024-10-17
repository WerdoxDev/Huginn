export default function ImageSelector(props: { data?: string | null; onDelete?: () => void; onSelected?: (data: string, mimeType: string) => void }) {
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

	return (
		<div className="flex shrink-0 rounded-lg bg-secondary p-3">
			<div onClick={openFileDialog} className="group relative cursor-pointer overflow-hidden rounded-full bg-black">
				{props.data ? (
					<img alt="editing-user-avatar" className="h-28 w-28 object-cover" src={props.data} />
				) : (
					<div className="h-28 w-28 bg-primary" />
				)}

				<div className="absolute inset-0 flex h-full w-full items-center justify-center gap-x-1.5 rounded-full opacity-0 transition-all duration-100 group-hover:bg-black/30 group-hover:opacity-100">
					<Tooltip>
						<Tooltip.Trigger className="rounded-md p-1 hover:bg-white/10">
							<IconMdiEdit className="size-7 text-white" />
						</Tooltip.Trigger>
						<Tooltip.Content>Edit</Tooltip.Content>
					</Tooltip>
					<Tooltip>
						<Tooltip.Trigger className="rounded-md p-1 hover:bg-white/10">
							<IconMdiDelete
								onClick={(e) => {
									e.stopPropagation();
									props.onDelete?.();
								}}
								className="size-7 text-error"
							/>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<div className="text-error">Delete</div>
						</Tooltip.Content>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
