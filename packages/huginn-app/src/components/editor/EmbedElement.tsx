import type { EmbedElement as SlateEmbedElement } from "@/index";
import ImagePreview from "@components/ImagePreview";
import VideoPlayer from "@components/VideoPlayer";
import { constants, constrainImageSize } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";
import type { RenderElementProps } from "slate-react";

export default function EmbedElement(props: RenderElementProps) {
	const { url, description, title, thumbnail, video } = props.element as SlateEmbedElement;
	const barebone = useMemo(() => description === undefined && title === undefined && (thumbnail || video), [description, title, thumbnail, video]);
	const dimensions = useMemo(
		() =>
			constrainImageSize(
				thumbnail?.width ?? video?.width ?? 0,
				thumbnail?.height ?? video?.height ?? 0,
				constants.EMBED_MEDIA_MAX_WIDTH,
				constants.EMBED_MEDIA_MAX_HEIGHT,
			),
		[thumbnail, video],
	);

	return (
		<div {...props.attributes} contentEditable={false} style={{ maxWidth: `${constants.EMBED_MEDIA_MAX_WIDTH + 16}px` }}>
			<div
				className={clsx("mt-1 mb-1 flex max-w-md flex-col items-start", !barebone && "rounded-lg border-background border-l-4 bg-tertiary p-2")}
			>
				{title && (
					<span
						className={clsx(url && "cursor-pointer text-accent hover:underline", description ? "mb-1" : "mb-2")}
						onClick={url ? () => window.electronAPI.openExteral(url) : undefined}
					>
						{title}
					</span>
				)}
				{description && <span className={clsx("text-sm", thumbnail && "mb-2")}>{description}</span>}
				<div className="relative">
					{thumbnail && (
						<ImagePreview
							width={dimensions.width}
							height={dimensions.height}
							originalWidth={thumbnail.width ?? 0}
							originalHeight={thumbnail.height ?? 0}
							url={thumbnail.url}
							disableQuery
						/>
					)}
					{video && <VideoPlayer url={video.url} width={dimensions.width} height={dimensions.height} />}
				</div>
			</div>
		</div>
	);
}
