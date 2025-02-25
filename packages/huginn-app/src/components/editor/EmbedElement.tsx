import type { EmbedElement as SlateEmbedElement } from "@/index";
import { useModalsDispatch } from "@contexts/modalContext";
import { constants, constrainImageSize } from "@huginn/shared";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import { useMemo } from "react";
import type { RenderElementProps } from "slate-react";

export default function EmbedElement(props: RenderElementProps) {
	const { image, url, description, title, width, height } = props.element as SlateEmbedElement;
	const dimensions = useMemo(
		() => constrainImageSize(width ?? 0, height ?? 0, constants.EMBED_IMAGE_MAX_WIDTH, constants.EMBED_IMAGE_MAX_HEIGHT),
		[width, height],
	);
	const dispatch = useModalsDispatch();

	return (
		<div {...props.attributes} contentEditable={false} style={{ maxWidth: `${constants.EMBED_IMAGE_MAX_WIDTH + 16}px` }}>
			<div className="mt-1 mb-1 flex max-w-md flex-col items-start rounded-lg bg-tertiary p-2">
				{title && (
					<span
						className={clsx(url && "cursor-pointer text-accent hover:underline", description ? "mb-1" : "mb-2")}
						onClick={url ? () => open(url) : undefined}
					>
						{title}
					</span>
				)}
				{description && <span className={clsx("text-sm", image && "mb-2")}>{description}</span>}
				{image && (
					<img
						src={image}
						alt="huginn"
						className="cursor-pointer rounded-md"
						onClick={() => dispatch({ magnifiedImage: { isOpen: true, url: image, width, height, filename: title } })}
						loading="lazy"
						style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
					/>
				)}
			</div>
		</div>
	);
}
