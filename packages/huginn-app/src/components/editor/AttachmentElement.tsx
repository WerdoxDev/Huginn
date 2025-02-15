import type { AttachmentElement as SlateAttachmentElement } from "@/index";
import Tooltip from "@components/tooltip/Tooltip";
import { isImageMediaType } from "@huginn/shared";
import { getSizeText } from "@lib/utils";
import { useHuginnWindow } from "@stores/windowStore";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function AttachmentElement(props: RenderElementProps) {
	const { contentType, url, description, size, width, height, filename } = props.element as SlateAttachmentElement;
	const huginnWindow = useHuginnWindow();

	function download() {
		if (huginnWindow.environment === "desktop") {
			open(url);
		} else {
			window.open(url);
		}
	}

	return (
		<div {...props.attributes} contentEditable={false}>
			<div className="mt-1 mb-1 flex flex-col items-start rounded-lg">
				{description && <span className={clsx("text-sm")}>{description}</span>}
				{isImageMediaType(contentType) ? (
					<img
						src={url}
						alt="huginn"
						className="rounded-md object-contain"
						style={{ width: `min(28rem,${width}px)`, height: `min(20rem,${height}px)` }}
					/>
				) : (
					<div className="flex w-full items-center gap-x-2 rounded-lg bg-secondary px-2 py-3">
						<IconMingcuteFileFill className="size-10 shrink-0" />
						<div className="flex flex-col justify-center gap-y-0.5">
							<div className="cursor-pointer text-accent text-sm hover:underline" onClick={download}>
								{filename}
							</div>
							<div className="text-white/50 text-xs">{getSizeText(size)}</div>
						</div>
						<Tooltip>
							<Tooltip.Trigger className="ml-auto" onClick={download}>
								<IconMingcuteDownload2Fill className="size-6 text-white/50 transition-colors duration-100 hover:text-white" />
							</Tooltip.Trigger>
							<Tooltip.Content>Download</Tooltip.Content>
						</Tooltip>
					</div>
				)}
			</div>
		</div>
	);
}
