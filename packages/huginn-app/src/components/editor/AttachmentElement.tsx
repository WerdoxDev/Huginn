import type { AttachmentElement as SlateAttachmentElement } from "@/index";
import ImagePreview from "@components/ImagePreview";
import VideoPlayer from "@components/VideoPlayer";
import Tooltip from "@components/tooltip/Tooltip";
import { useSettings } from "@contexts/settingsContext";
import { useOpen } from "@hooks/useOpen";
import { constants, changeUrlBase, constrainImageSize, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import { getSizeText } from "@lib/utils";
import clsx from "clsx";
import { useMemo } from "react";
import type { RenderElementProps } from "slate-react";

export default function AttachmentElement(props: RenderElementProps) {
	const { contentType, url, description, size, width, height, filename } = props.element as SlateAttachmentElement;
	const { openUrl } = useOpen();
	const dimensions = useMemo(
		() => constrainImageSize(width ?? 0, height ?? 0, constants.ATTACHMENT_MEDIA_MAX_WIDTH, constants.ATTACHMENT_MEDIA_MAX_HEIGHT),
		[width, height],
	);
	const settings = useSettings();
	const basedUrl = useMemo(() => changeUrlBase(url, `${settings.cdnAddress}/cdn`), [url]);

	return (
		<div {...props.attributes} contentEditable={false}>
			<div className="relative mt-1 mb-1 flex flex-col items-start">
				{description && <span className={clsx("text-sm")}>{description}</span>}
				{isImageMediaType(contentType) ? (
					<ImagePreview
						filename={filename}
						width={dimensions.width}
						height={dimensions.height}
						originalWidth={width ?? 0}
						originalHeight={height ?? 0}
						url={basedUrl}
					/>
				) : isVideoMediaType(contentType) ? (
					<VideoPlayer url={basedUrl} width={dimensions.width} height={dimensions.height} />
				) : (
					<div className="flex w-[24rem] items-center gap-x-2 rounded-lg bg-secondary px-2 py-3">
						<IconMingcuteFileFill className="size-10 shrink-0" />
						<div className="flex w-full flex-col justify-center gap-y-0.5 overflow-hidden rounded-lg px-2.5">
							<div
								className="cursor-pointer overflow-hidden text-ellipsis text-nowrap text-accent text-sm hover:underline"
								onClick={() => openUrl(basedUrl)}
							>
								{filename}
							</div>
							<div className="text-white/50 text-xs">{getSizeText(size)}</div>
						</div>
						<Tooltip>
							<Tooltip.Trigger className="mx-2" onClick={() => openUrl(basedUrl)}>
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
