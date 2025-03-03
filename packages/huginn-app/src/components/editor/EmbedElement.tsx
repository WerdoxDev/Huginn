import type { EmbedElement as SlateEmbedElement } from "@/index";
import VideoPlayer from "@components/VideoPlayer";
import { useModalsDispatch } from "@contexts/modalContext";
import { constants, constrainImageSize } from "@huginn/shared";
import { open } from "@tauri-apps/plugin-shell";
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
	const dispatch = useModalsDispatch();

	return (
		<div {...props.attributes} contentEditable={false} style={{ maxWidth: `${constants.EMBED_MEDIA_MAX_WIDTH + 16}px` }}>
			<div className={clsx("mt-1 mb-1 flex max-w-md flex-col items-start", !barebone && "rounded-lg bg-tertiary p-2")}>
				{title && (
					<span
						className={clsx(url && "cursor-pointer text-accent hover:underline", description ? "mb-1" : "mb-2")}
						onClick={url ? () => open(url) : undefined}
					>
						{title}
					</span>
				)}
				{description && <span className={clsx("text-sm", thumbnail && "mb-2")}>{description}</span>}
				{thumbnail && (
					<img
						src={thumbnail.url}
						alt="huginn"
						className={clsx("cursor-pointer", barebone ? "rounded-lg" : "rounded-md")}
						onClick={() =>
							dispatch({
								magnifiedImage: { isOpen: true, url: thumbnail.url, width: thumbnail.width, height: thumbnail.height, filename: title },
							})
						}
						loading="lazy"
						style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
					/>
				)}
				{video && (
					<VideoPlayer className={clsx(!barebone && "!rounded-md")} url={video.url} width={dimensions.width} height={dimensions.height} />
				)}
			</div>
		</div>
	);
}
